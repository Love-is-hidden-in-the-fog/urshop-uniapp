<script>
	import routingIntercept from '@/permission.js'
	export default {
		onLaunch: function() {
			// 对路由进行统一拦截，实现路由导航守卫 router.beforeEach 功能
			routingIntercept()
			console.log(111)
		},
		onShow: function() {
			// console.log('App Show')
		},
		onHide: function() {
			// console.log('App Hide')
		}
	}
</script>

<style lang="scss" >
	/*每个页面公共css */
	/* 注意要写在第一行，同时给style标签加入lang="scss"属性 */
	@import "@/uni_modules/uview-plus/index.scss";
</style>
