export default (params) => {
	

  return (uni.request({
		url:`http://demo.urshop.cn/api/${params.url}`,
		data:params.params
	}).then(res=>{
		return res.data
	})
	)
}