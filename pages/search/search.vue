<template>
	<view>
		<view class="search">
			<u-search @search="search" bgColor="#fff" :show-action="false" :clearabled="true" shape="round"
				placeholder="搜一搜" v-model="keyword" ></u-search>
		</view>
		    <scroll-view v-if="searchContent.length!==0" scroll-y class="search-scroll" @scrolltolower="searchLower">
		      <view v-for=" (item,index) in searchContent" :key="index">
		        <navigator class="sear-cont" :url="`/pages/detail/detail?id=${item.Id}`">
		          <view class="sear-img">
		            <image :src="item.Picture.NormalUrl"></image>
		          </view>
		          <view class="sear-info">
		            <text class="sear-name">{{item.Name}}</text>
		            <text class="sear-sale">售出：{{item.SaleVolume}}</text>
		            <text class="sear-price price-color">{{item.Price.Price}}</text>
		          </view>
		        </navigator>
		      </view>
		      <view class="sear-nofind" v-if="searchContent.length==0">
		        <text>找不到该商品</text>
		      </view>
		    </scroll-view>
	</view>
</template>

<script setup >
	import { onLoad } from '@dcloudio/uni-app'
	import {ref} from "vue"
	import {getSearch} from "@/apis/index.js"
	let searchContent =ref([])
	let page=ref(1)
	const keyword=ref("")
	const search=async(val)=>{
		console.log(val)
		const res =await getSearch({q:val,page:page.value})
		searchContent.value=res.Data.Items
		console.log(searchContent.value)
	}
	// 下拉刷新
	const searchLower=async()=>{
		page.value++
		const res =await getSearch({q:keyword.value,page:page.value})
		searchContent.value=[...searchContent.value,...res.Data.Items]
		console.log(searchContent.value)
	}
	
	onLoad((option)=>{
		// console.log(option)
		keyword.value=option.value
		search(keyword.value)
	})
</script>

<style lang="scss" scoped>
	.search {
		width: 101%;
		height: 100rpx;
		box-sizing: border-box;
		padding: 20rpx 30rpx;
		background-color: #950000;
		.u-search {
			height: 60rpx;
		}
	}
	.search-scroll {
	    position: fixed;
	    top: 192rpx;
	    left: 0;
	    right: 0;
	    bottom: 0;
		.sear-cont {
		    display: flex;
		    align-items: center;
		    padding: 20rpx;
		    border-bottom: 1px solid #ededed;
		    background-color: #fff;
			.sear-img {
			    width: 150rpx;
			    min-width: 150rpx;
			    height: 150rpx;
			    border-radius: 50%;
			    overflow: hidden;
				image {
				    width: 100%;
				    height: 100%;
				}
			}
			.sear-info {
			    display: flex;
			    flex-direction: column;
			    margin-left: 50rpx;
			    width: 460rpx;
			    flex: 1;
				.sear-name {
				    color: #333;
				}
				.sear-sale {
				    font-size: 24rpx;
				}
				.price-color {
				    color: #950000;
				}
			}
		}
	}
</style>
