import request from "@/axios/request.js"
export const getbyidList = (params)=>{
	return request({
		url:"v1/goods/getbyid",
		params
	})
}