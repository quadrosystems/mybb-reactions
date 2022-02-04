

// -----------------------------------------------------------------------------

export class JsonRpcError extends Error {
  errorData?: any;

  constructor(message: string, errorData?: any) {
    super(message);

    // fix instanceof checking in typescript
    Object.setPrototypeOf(this, JsonRpcError.prototype);

    this.name = "JsonRpcError";
    this.errorData = errorData;
  }
}


export async function callJsonRpc(url: string, method: string, params: any): Promise<any> {
  const requestData = {
    'jsonrpc': '2.0',
    'id': 1,
    'method': method,
    'params': params,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });

  if (response.status !== 200) {
    throw new JsonRpcError(`HTTP response status code isn't 200`);
  }

  const responseData = await response.json();

  if ('error' in responseData) {
    const errorData = responseData['error'];
    throw new JsonRpcError(`Got error (${JSON.stringify(responseData, null, 2)})`, errorData);
  }

  return responseData['result'];
}


export async function callRusff(method: string, params: any): Promise<any> {
  const url = 'https://core.rusff.me/rusff.php';

  // const check = {
  //   'service': 'QServices',
  // };
  const check = {
    "board_id": (window as any)['BoardID'],
    "group_id": (window as any)['GroupID'],
    "partner_id": (window as any)['PartnerID'],
    "sign": (window as any)['ForumAPITicket'],
    "user_id": (window as any)['UserID'],
    "user_lastvisit": (window as any)['UserLastVisit'],
  };

  return await callJsonRpc(url, method, {
    check,
    ...params,
  });
}

// -----------------------------------------------------------------------------

export type UserData = {
  userId: number,
  userLogin: string,
  reactedAt: number,
}
export type ReactionData = {
  reactionCode: string,
  users: UserData[],
}
export type PostData = {
  postId: number,
  reactions: ReactionData[],
}

// -----------------------------------------------------------------------------

const transformPostReaction = (data: any) => {
  return {
    userId: data['user']['user_id'],
    userLogin: data['user']['user_login'],
    reactedAt: data['created_at'],
  };
}
const transformPostReactions = (data: any): any => {
  const result: ReactionData[] = [];
  Object.keys(data).forEach((key) => {
    result.push({
      reactionCode: key,
      users: data[key].map((item: any) => transformPostReaction(item)),
    });
  });
  return result;
}
const transformReactionsIndex = (data: any): PostData[] => {
  return data.map((item: any) => {
    return {
      postId: item['post_id'],
      reactions: transformPostReactions(item['reactions']),
    };
  });
}

// -----------------------------------------------------------------------------

export async function reactionsIndex(
  boardId: number,
  // userId: number,
  postIds: number[],
): Promise<PostData[]> {
  const params = {
    'board_id': boardId,
    // 'user_id': userId,
    'post_ids': postIds,
  };
  const result = await callRusff('reactions/index', params);

  return transformReactionsIndex(result);
}

export async function reactionsAdd(
  boardId: number,
  userId: number,
  postId: number,
  reactionCode: string,
): Promise<any> {
  const params = {
    'board_id': boardId,
    'user_id': userId,
    'post_id': postId,
    'reaction_code': reactionCode,
  };
  return await callRusff('reactions/add', params);
}

export async function reactionsDelete(
    boardId: number,
    userId: number,
    postId: number,
    reactionCode: string,
): Promise<any> {
  const params = {
    'board_id': boardId,
    'user_id': userId,
    'post_id': postId,
    'reaction_code': reactionCode,
  };
  return await callRusff('reactions/delete', params);
}

// -----------------------------------------------------------------------------
