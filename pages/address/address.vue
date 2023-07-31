<template>
	<view class="address" v-if="Object.keys(formdata).length === 0">
		<view class="txt" >暂无收货人信息</view>

	</view>
	<view class="address" v-if="Object.keys(formdata).length !== 0">
		 <view class="name">
		 	收货人：{{formdata.name}}
		 </view>
		 <view class="name">
		 	手机号码：{{formdata.phone}}
		 </view>
		 <view class="name">
		 	地区：{{formdata.address}}
		 </view>
		 <view class="name">
		 	详细地址：{{formdata.addressDetail}}
		 </view>
	</view>
	<view class="button">
		<button @click="nav" >添加收货人信息</button>
	</view>
</template>

<script setup>
	import {ref} from "vue"
	import { onLoad } from '@dcloudio/uni-app'
	let product=ref([])
	let formdata=ref({})
	const nav=()=>{
		uni.navigateTo({
			url:"../address-editor/address-editor"
		})
	}
	onLoad((option)=>{
		console.log(option)
		if(Object.keys(option).length !== 0){
			formdata.value={
				name:option.name,
				phone:option.phone,
				address:option.address,
				addressDetail:option.addressDetail
			}
		}
	})
</script>

<style lang="scss" scoped>
	.address{
		width: 100%;
		.txt{
			padding: 30rpx;
			color: #ccc;
			text-align: center;
		}
		.name{
			padding: 20rpx;
			font-size: 40rpx;
			border-bottom: 2rpx solid #ccc;
			
		}
	}
	.button{
		width: 100%;
		position: absolute;
		bottom: 0;
		left: 0;
		button{
			background-color:#950000;
			color: #fff;
			border-radius: 0;
		}
	}
</style>
