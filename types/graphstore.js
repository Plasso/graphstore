type EdgeDataT = {
  id: number;
  nodeId: string;
  data: ?{};
};

type EdgeLimitOffsetT = {
  offset: number;
  limit: number;
};

type EdgeFirstAfterT = {
  first?: number;
  after?: number;
};

type NodeDataT = {
  id: string;
  updateId: number;
};

type EdgesT = {
  hasNextPage: boolean;
  edges: Array<EdgeDataT>;
};

interface NodeT {
  create(data: {}): Promise<NodeDataT>;
  read(ids: Array<string>): Promise<Array<NodeDataT>>;
  update(node: NodeDataT): Promise<boolean>;
  delete(id: string): Promise<void>;
  getName(): string;
}

interface EdgeT {
  getName(): string;
  create(leftNodeId: string, rightNodeId: string, data: ?{}): Promise<number>;
  update(leftId: string, id: number, data: ?{}): Promise<void>;
  delete(leftId: string, id: number): Promise<void>;
  getCount(leftId: string): Promise<number>;
  getFirstAfter(leftId: string, firstAfter: EdgeFirstAfterT): Promise<EdgesT>;
}

interface DictionaryT {
  getName(): string;
  read(keys: Array<string>): Promise<Array<?string>>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
