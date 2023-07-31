<template >
	<view class="container">
		<view class="userinfo">
			<view class="user-img">
				<image src="../../static/images/logo.png"></image>
			</view>
			<view class="userinfo-nickname">
				<text class="user-name">{{username}}</text>
				<view class="bindphone-box">
					<text class='bindPhone'>绑定手机号</text>
				</view>
			</view>
		</view>
		<view class="con">
			<view class="item" @click="item1" >
				<view class="item-1">
					<u-icon size="40" name="man-add"></u-icon>
				</view>
				<view class="item-2">
					成为合伙人
				</view>
				<view class="item-3">
					<u-icon  color="#ccc" size="40" name="arrow-right"></u-icon>
				</view>
			</view>
			<view class="item" @click="nav('order')" >
				<view class="item-1">
					<u-icon size="40" name="file-text-fill"></u-icon>
				</view>
				<view class="item-2">
					我的订单
				</view>
				<view class="item-3">
					<u-icon  color="#ccc" size="40" name="arrow-right"></u-icon>
				</view>
			</view>
			<view class="item" @click="nav('orderList')"> 
				<view class="item-1">
					<u-icon size="40" name="question-circle"></u-icon>
				</view>
				<view class="item-2">
					退款售后
				</view>
				<view class="item-3">
					<u-icon  color="#ccc" size="40" name="arrow-right"></u-icon>
				</view>
			</view>
			<view class="item" @click="nav('address')" >
				<view class="item-1">
					<u-icon size="40" name="map-fill"></u-icon>
				</view>
				<view class="item-2">
					收货地址
				</view>
				<view class="item-3">
					<u-icon  color="#ccc" size="40" name="arrow-right"></u-icon>
				</view>
			</view>
			<view class="item"  >
				<view class="item-1">
					<u-icon size="40" name="server-man"></u-icon>
				</view>
				<view class="item-2">
					联系客服
				</view>
				<view class="item-3">
					<u-icon  color="#ccc" size="40" name="arrow-right"></u-icon>
				</view>
			</view>
			<view class="item" @click="nav('question')" >
				<view class="item-1">                
					<u-icon size="40" name="info-circle-fill"></u-icon>
				</view>                              
				<view class="item-2">                
					关于我们                          
				</view>                              
				<view class="item-3">                
					<u-icon  color="#ccc" size="40" name="arrow-right"></u-icon>
				</view>                              
			</view>                                  
			<view class="item" @click="nav('question2')" >
				<view class="item-1">
					<u-icon size="40" name="info-circle-fill"></u-icon>
				</view>
				<view class="item-2">
					购买须知
				</view>
				<view class="item-3">
					<u-icon  color="#ccc" size="40" name="arrow-right"></u-icon>
				</view>
			</view>
		</view>
		<view class='banner' v-if="bannerList2.length!==0" >
			<navigator :url="bannerList2[0].Url">
				<image :src="bannerList2[0].Picture.BigUrl" ></image>
			</navigator>
		</view>
	</view>
</template>

<script setup >
	import {ref} from "vue"
	import {getABannerList2} from "@/apis/index.js"
	import { onLoad } from '@dcloudio/uni-app'
	let username=ref("11")
	let bannerList2=ref([])
	let item1=()=>{
		uni.showModal({
			title: '提示',
			content: '审核中',
			success: function (res) {
				if (res.confirm) {
					console.log('用户点击确定');
				} else if (res.cancel) {
					console.log('用户点击取消');
				}
			}
		});
	}
	let nav=(name)=>{
		switch (name){
			case "order":
				console.log("order")
				uni.navigateTo({
					url:"../order/order"
				})
				break;
			case "orderList":
				console.log("orderList")
				uni.navigateTo({
					url:"../orderList/orderList"
				})
				break;
			case "address":
				console.log("address")
				uni.navigateTo({
					url:"../address/address"
				})
				break;
			case "question":
				console.log("question")
				uni.navigateTo({
					url:"../question/question?name=aboutus"
				})
				break;
			case "question2":
				uni.navigateTo({
					url:"../question/question?name=serviceProtocol"
				})
				console.log("question2")
				break;
			default:
				break;
		}
	} 
	onLoad(async()=>{
		const res = await getABannerList2({ name: 'homehotbanner-second-mobile' })
		 bannerList2.value = res.Data.Items;
		 console.log(bannerList2.value)
	})
</script>

<style lang="scss">
.userinfo {
    position: relative;
    display: flex;
    padding: 30rpx;
    align-items: center;
    background: #950000;
	width: 100%;
	.user-img {
	    width: 130rpx;
	    height: 130rpx;
	    border-radius: 50%;
	    margin-right: 20rpx;
	    overflow: hidden;
		image{
			width: 128rpx;
			height: 128rpx;
		}
	}
	.userinfo-nickname {
	    color: #fff;
	    margin-left: 20rpx;
		.user-name {
		    display: block;
		    font-size: 30rpx;
		    color: #fff;
			margin-bottom: 10rpx;
		}
		.bindPhone {
		    border: 1px solid #fff;
		    padding: 5rpx 10rpx;
		    border-radius: 10rpx;
		    font-size: 20rpx;
		    color: #fff;
		}
	}
}
.con{
	width: 100%;
	.item{
		display: flex;
		padding: 40rpx 30rpx 40rpx 0rpx;
		margin-left: 30rpx;
		border-bottom: 1rpx solid #ccc ;
		.item-2{
			font-size: 30rpx;
			width: 30%;
			margin: 0 400rpx 0 30rpx ;
		}
	}
}

.banner{
	width: 100%;
	image{
		width: 100%;
		height: 180rpx;
	}
}
</style>
