type EdgeDataT = {
  id: number;
  nodeId: string;
};

type EdgeLimitOffsetT = {
  offset: number;
  limit: number;
};

type EdgeFirstAfterT = {
  first: number;
  after: string;
};

type NodeDataT = {
  id: string;
};

type EdgesT = {
  hasNextPage: boolean;
  edges: Array<EdgeDataT>;
};

interface NodeT {
  create(data: {}): Promise<string>;
  read(ids: Array<string>): Promise<Array<NodeDataT>>;
  update(id: string, node: NodeDataT, ?updateId: number): Promise<void>;
  delete(id: string): Promise<void>;
  getName(): string;
}

interface EdgeT {
  getName(): string;
  create(leftNodeId: string, rightNodeId: string): Promise<number>;
  delete(id: string): Promise<void>;
  getCount(leftId: string): Promise<number>;
  getLimitOffset(leftId: string, limitOffset: EdgeLimitOffsetT): Promise<EdgesT>;
  getFirstAfter(leftId: string, firstAfter: EdgeFirstAfterT): Promise<EdgesT>;
}

