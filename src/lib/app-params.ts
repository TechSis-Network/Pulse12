const isNode = typeof window === 'undefined';
const storage = isNode ? null : window.localStorage;

const toSnakeCase = (str: string) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName: string, { defaultValue, removeFromUrl = false }: { defaultValue?: string; removeFromUrl?: boolean } = {}) => {
	if (isNode) {
		return defaultValue;
	}
	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = urlParams.get(paramName);
	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
	}
	if (searchParam) {
		storage?.setItem(storageKey, searchParam);
		return searchParam;
	}
	if (defaultValue) {
		storage?.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	const storedValue = storage?.getItem(storageKey);
	if (storedValue) {
		return storedValue;
	}
	return null;
}

const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === 'true') {
		storage?.removeItem('base44_access_token');
		storage?.removeItem('token');
	}
	return {
		appId: import.meta.env.VITE_BASE44_APP_ID?.trim(),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getAppParamValue("from_url", { defaultValue: isNode ? undefined : window.location.href }),
		functionsVersion: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION?.trim() || undefined,
		appBaseUrl: import.meta.env.VITE_BASE44_APP_BASE_URL?.trim().replace(/\/+$/, ''),
	}
}


export const appParams = {
	...getAppParams()
}
