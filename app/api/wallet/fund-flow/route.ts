export async function POST(req: Request) {
  try {
    const { account } = await req.json();

    if (!account) {
      return Response.json(
        { error: 'Account address is required' },
        { status: 400 }
      );
    }

    const url = 'https://alpha-biz.sodex.dev/biz/mirror/account_flow';
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json;charset=UTF-8',
      'Origin': 'https://sodex.com',
      'Referer': 'https://sodex.com/',
    };

    const payload = {
      account,
      start: 0,
      limit: 1000,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return Response.json(
        { error: `Failed to fetch fund flow data: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.code !== '0') {
      return Response.json(
        { error: data.message || 'API returned an error' },
        { status: 400 }
      );
    }

    return Response.json(data);
  } catch (error) {
    console.error('[v0] Fund flow API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
