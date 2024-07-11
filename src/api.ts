import axios from "axios";

const USER_AGENT =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.3";

// GET only
const REWARDS_INFO_URLS = {
	GENSHIN_IMPACT:
		"https://sg-hk4e-api.hoyolab.com/event/sol/home?act_id=e202102251931481",
	HONKAI_STAR_RAIL:
		"https://sg-public-api.hoyolab.com/event/luna/os/home?act_id=e202303301540311",
	ZENLESS_ZONE_ZERO:
		"https://sg-act-nap-api.hoyolab.com/event/luna/zzz/os/home?act_id=e202406031448091",
};

// GET only
const CHECK_IN_INFO_URLS = {
	GENSHIN_IMPACT:
		"https://sg-hk4e-api.hoyolab.com/event/sol/info?lang=en-us&act_id=e202102251931481",
	HONKAI_STAR_RAIL:
		"https://sg-public-api.hoyolab.com/event/luna/os/info?lang=en-us&act_id=e202303301540311",
	ZENLESS_ZONE_ZERO:
		"https://sg-act-nap-api.hoyolab.com/event/luna/zzz/os/info?lang=en-us&act_id=e202406031448091",
};

// POST only
// Doesn't give any info about check-in, thus we use the above URLS.
const CHECK_IN_URLS = {
	GENSHIN_IMPACT:
		"https://sg-hk4e-api.hoyolab.com/event/sol/sign?lang=en-us&act_id=e202102251931481",
	HONKAI_STAR_RAIL:
		"https://sg-public-api.hoyolab.com/event/luna/os/sign?lang=en-us&act_id=e202303301540311",
	ZENLESS_ZONE_ZERO:
		"https://sg-act-nap-api.hoyolab.com/event/luna/zzz/os/sign?lang=en-us&act_id=e202406031448091",
};

interface Cookie {
	ltoken: string;
	ltuid: string;
}

interface Response {
	retcode: number;
	message: string;
	data: unknown;
}

interface CheckInInfoResponse extends Response {
	data: {
		total_sign_day: number;
		today: string;
		is_sign: boolean;
		is_sub: boolean;
		region: string;
		sign_cnt_missed?: number;
		short_sign_day?: number;
		send_first?: false;
	};
}

interface MonthlyRewardsResponse extends Response {
	data: {
		month: number;
		awards: {
			icon: string;
			name: string;
			cnt: string;
		}[];
		resign: boolean;
		now: string;
	};
}

export async function checkIn(
	cookie: Cookie,
	game: keyof typeof CHECK_IN_URLS,
	v2: boolean | (() => boolean) = false
): Promise<Response> {
	const url = CHECK_IN_URLS[game];

	const cookiePrefix = v2 ? "_v2" : "";
	const headers = {
		Cookie: `ltoken${cookiePrefix}=${cookie["ltoken"]}; ltuid${cookiePrefix}=${cookie["ltuid"]};`,
		"User-Agent": USER_AGENT,
		Origin: "https://act.hoyolab.com",
		Connection: "keep-alive",
		Referer: "https://act.hoyolab.com/",
	};

	const axiosConfig = {
		headers,
		timeout: 10000,
		retries: 3,
		retryDelay: (retryCount: number) => retryCount * 1000,
	};

	const response = await axios.post(url, null, axiosConfig);
	const responseData: Response = response.data;
	return responseData;
}

export async function getCheckInInfo(
	cookie: Cookie,
	game: keyof typeof CHECK_IN_INFO_URLS,
	v2: boolean | (() => boolean) = false
): Promise<CheckInInfoResponse> {
	const url = CHECK_IN_INFO_URLS[game];

	const cookiePrefix = v2 ? "_v2" : "";
	const headers = {
		Cookie: `ltoken${cookiePrefix}=${cookie["ltoken"]}; ltuid${cookiePrefix}=${cookie["ltuid"]};`,
		"User-Agent": USER_AGENT,
		Origin: "https://act.hoyolab.com",
		Connection: "keep-alive",
		Referer: "https://act.hoyolab.com/",
	};

	const axiosConfig = {
		headers,
		timeout: 10000,
		retries: 3,
		retryDelay: (retryCount: number) => retryCount * 1000,
	};

	const response = await axios.get(url, axiosConfig);
	const responseData: CheckInInfoResponse = response.data;
	return responseData;
}

export async function getMonthlyRewards(
	game: keyof typeof REWARDS_INFO_URLS
): Promise<MonthlyRewardsResponse> {
	const url = REWARDS_INFO_URLS[game];

	const axiosConfig = {
		timeout: 10000,
		retries: 3,
		retryDelay: (retryCount: number) => retryCount * 1000,
	};

	const response = await axios.get(url, axiosConfig);
	const responseData: MonthlyRewardsResponse = response.data;
	return responseData;
}
