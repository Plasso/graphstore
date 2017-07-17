type EdgeRecord = {
  id: number;
  leftNodeType: string;
  leftNodeId: string;
  rightNodeType: string;
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
  createEdge(leftNodeType: string, leftNodeId: string, rightNodeType: string, rightNodeId: string): Promise<string>;
  edgeCount(leftId: string): Promise<number>;
  getEdgesForward(leftId: string, limitOffset: EdgeLimitOffset): Promise<Array<EdgeRecord>>;
  getEdgesBackwards(leftId: string, limitOffset: EdgeLimitOffset): Promise<Array<EdgeRecord>>;
  getEdgesAfterId(leftId: string, afterFirst: EdgeAfterFirst): Promise<Array<EdgeRecord>>;
  getEdgesBeforeId(leftId: string, afterFirst: EdgeBeforeLast): Promise<Array<EdgeRecord>>;
}

interface NodeDelegate {
  createNode(data: {}): Promise<string>;
  readNode(id: string): Promise<{}>;
  updateNode(id: string, newNode: {}, updateId: string): Promise<void>;
  deleteNode(id: string): Promise<void>;
  getNodeType(): string;
}

