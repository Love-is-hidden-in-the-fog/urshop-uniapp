<!-- 本示例未包含完整css，获取外链css请参考上文，在hello uni-app项目中查看 -->
<template>
	<view>
		<view class="form" >
			<form @submit="formSubmit" >
				<view class="uni-form-item uni-column">
					<view class="title">收货人：</view>
					<input class="uni-input" name="name" placeholder="请输入收货人姓名" />
				</view>
				<view class="uni-form-item uni-column">
					<view class="title">手机号码：</view>
					<input class="uni-input" name="phone" placeholder="请输入手机号码" />
				</view>
				<view class="uni-form-item uni-column">
					<view class="title">地区：</view>
					<input class="uni-input" name="address" placeholder="请选择所在地区" />
				</view>
				<view class="uni-form-item uni-column">
					<view class="title">详细地址：</view>
					<input class="uni-input" name="addressDetail" placeholder="请输入详细地址" />
				</view>
				<view class="uni-btn-v">
					<button class="btn" form-type="submit">添加</button>
					<!-- <button type="default" form-type="reset">Reset</button> -->
				</view>
			</form>
		</view>
	</view>
</template>


<script setup >
import { ref } from 'vue';



const formSubmit=(e)=> {
				if(e.detail.value.phone.length!==11){
					uni.showToast({
						icon:"error",
						title:"手机号码格式不对"
					})
					return
				}
				if(e.detail.value.name.length==0){
					uni.showToast({
						icon:"error",
						title:"姓名不能为空"
					})
					return
				}
					let formdata = e.detail.value
					console.log(formdata)
					
					uni.navigateTo({
						url:`../address/address?name=${formdata.name}&address=${formdata.address}&phone=${formdata.phone}&addressDetail=${formdata.addressDetai}&`
					})	
			}

</script>

<style scoped>
	.form{
		padding-top: 30rpx;
		width: 100%;
		height: 100vh;
		box-sizing: border-box;
		background-color: aliceblue;
	}
	.uni-form-item  {
		display: flex;
		background-color: #fff;
		padding: 35rpx 40rpx ;
		border-bottom: 4rpx solid #ccc;
	}
	.uni-form-item .title{
		width: 200rpx;
	}
	.uni-btn-v .btn{
		margin-top: 30rpx;
		width: 90%;
		background-color: #950000;
		color: #fff;
	}
</style>