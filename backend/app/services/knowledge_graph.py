from typing import List, Dict, Any
from app.models.schemas import (
    KnowledgeGraphData, GraphNode, GraphEdge, EntityExtraction, ClauseBlock, ContractMetadata
)

class KnowledgeGraphService:
    """
    Constructs and updates the Legal Knowledge Graph linking
    Contracts -> Entities (Parties, Dates, Law) -> Clauses -> Risk Levels -> Precedents.
    """

    @classmethod
    def build_graph(
        cls, 
        contract: ContractMetadata,
        entities: List[EntityExtraction],
        clauses: List[ClauseBlock]
    ) -> KnowledgeGraphData:
        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []
        node_ids = set()

        def add_node(node: GraphNode):
            if node.id not in node_ids:
                nodes.append(node)
                node_ids.add(node.id)

        # 1. Root Contract Node
        root_id = f"contract_{contract.id}"
        add_node(GraphNode(
            id=root_id,
            label=contract.filename,
            type="Contract",
            group="root",
            properties={
                "file_type": contract.file_type,
                "profile": contract.risk_profile.value,
                "words": contract.total_words
            }
        ))

        # 2. Entity Nodes
        for i, ent in enumerate(entities):
            ent_id = f"entity_{i}_{ent.category}"
            add_node(GraphNode(
                id=ent_id,
                label=f"{ent.category}: {ent.text}",
                type="Entity",
                group=ent.category.lower(),
                properties={"confidence": ent.confidence, "text": ent.text}
            ))
            edges.append(GraphEdge(
                source=root_id,
                target=ent_id,
                label="HAS_ENTITY",
                weight=1.5
            ))

        # 3. Clause Nodes & Risk Links
        for clause in clauses:
            clause_id = f"node_{clause.id}"
            add_node(GraphNode(
                id=clause_id,
                label=clause.title,
                type="Clause",
                group=f"risk_{clause.risk_level.value.lower()}",
                properties={
                    "category": clause.category.value,
                    "risk_level": clause.risk_level.value,
                    "risk_score": clause.risk_score,
                    "red_flags": len(clause.red_flag_phrases)
                }
            ))
            edges.append(GraphEdge(
                source=root_id,
                target=clause_id,
                label="CONTAINS_CLAUSE",
                weight=1.0
            ))

            # If clause has redline/risk, link to a risk node
            if clause.risk_level.value in ["HIGH", "CRITICAL"]:
                risk_id = f"risk_{clause.risk_level.value}_{clause.id}"
                add_node(GraphNode(
                    id=risk_id,
                    label=f"Flag: {clause.risk_level.value}",
                    type="RiskIndicator",
                    group="risk_flag",
                    properties={"score": clause.risk_score}
                ))
                edges.append(GraphEdge(
                    source=clause_id,
                    target=risk_id,
                    label="EXHIBITS_RISK",
                    weight=2.0
                ))

            # Connect governing law entity directly to governing law clause if present
            if clause.category.value == "Governing Law & Jurisdiction":
                for ent in entities:
                    if ent.category == "GOVERNING_LAW":
                        ent_node_id = f"entity_{entities.index(ent)}_{ent.category}"
                        if ent_node_id in node_ids:
                            edges.append(GraphEdge(
                                source=clause_id,
                                target=ent_node_id,
                                label="DEFINES_JURISDICTION",
                                weight=1.8
                            ))

        return KnowledgeGraphData(nodes=nodes, edges=edges)

# Global singleton
knowledge_graph_service = KnowledgeGraphService()
