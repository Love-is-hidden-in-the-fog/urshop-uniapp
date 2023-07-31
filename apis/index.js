import request from "@/axios/request.js"
export const getABannerList = (params)=>{
	return request({
		url:"v1/common/banner",
		params
	})
}

// 获取CategortList
export const getACategortList = (path)=>{
	return request({
		url:`v1/category/${path}`
		
	})
}

export const getABannerList2 = (params)=>{
	return request({
		url:"v1/common/banner",
		params
	})
}

// 热销榜单
export const getAProductList = (params)=>{
	return request({
		url:"v1/search/findbycid",
		params
	})
}

export const getASubList = (params)=>{
	return request({
		url:"v1/category/sublist",
		params
	})
}

export const getFindbycid = (params)=>{
	return request({
		url:"v1/search/findbycid",
		params
	})
}

export const getAboutus = (params)=>{
	return request({
		url:"v1/topic/detail",
		params
	})
}

// 搜索
 export const getSearch = (params)=>{
 	return request({
 		url:"v1/search/find",
 		params
 	})
 }