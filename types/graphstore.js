type EdgeRecord = {
  id: number;
  leftNodeId: string;
  rightNodeId: string;
};

type EdgeLimitOffset = {
  offset: number;
  limit: number;
};

type EdgeAfterFirst = {
  after: string;
  first: number;
};

type EdgeBeforeLast = {
  before: string;
  last: number;
};

interface EdgeDelegate {
  edgeName(leftId: string): Promise<string>;
  createEdge(leftNodeId: string, rightNodeId: string): Promise<string>;
  edgeCount(leftId: string): Promise<number>;
  getEdgesForward(leftId: string, limitOffset: EdgeLimitOffset): Promise<Array<EdgeRecord>>;
  getEdgesBackwards(leftId: string, limitOffset: EdgeLimitOffset): Promise<Array<EdgeRecord>>;
  getEdgesAfterId(leftId: string, afterFirst: EdgeAfterFirst): Promise<Array<EdgeRecord>>;
  getEdgesBeforeId(leftId: string, afterFirst: EdgeBeforeLast): Promise<Array<EdgeRecord>>;
}

interface NodeDelegate {
  createNode(data: {}): Promise<string>;
  readNodes(ids: Array<string>): Promise<Array<{id: string}>>;
  updateNode(id: string, newNode: { id: string }, updateId: string): Promise<void>;
  deleteNode(id: string): Promise<void>;
  getNodeType(): string;
}

