<template>
	<view class="order">
		<view class="tabs">
			<div class="item" :class="{ 'active': activeTab === '全部' }" @click="changeTab('全部')">全部</div>
			<div class="item" :class="{ 'active': activeTab === '待付款' }" @click="changeTab('待付款')">待付款</div>
			<div class="item" :class="{ 'active': activeTab === '待配送' }" @click="changeTab('待配送')">待配送</div>
			<div class="item" :class="{ 'active': activeTab === '待收获' }" @click="changeTab('待收获')">待收获</div>
			<div class="item" :class="{ 'active': activeTab === '已收货' }" @click="changeTab('已收货')">已收货</div>
		</view>
		<view class="con">
			<view class="product-view2">
				<view class="product-view2-item" v-for="(item, index) in productlist" :key="index">
					<navigator  :url="`/pages/detail/detail?id=${item.Id}`"
						class="product-view2-box">
						<view class="product-img">
							<image :src="item.Picture.NormalUrl" />
						</view>
						<view class="pruduct-info">
							<view class="product-t">
								<span class="product-name" :data-detailId="item.Id">{{ item.Name }}</span>
								<span class="product-srot" :data-detailId="item.Id">{{ item.Short }}</span>
							</view>
							<view class="price">
								<span class="product-price price-color">{{ item.Price.Price }}</span>
								<span class="product-oldprice"
									v-if="item.Price.OldPrice !== '¥0.00'">{{ item.Price.OldPrice }}</span>
							</view>
						</view>
					</navigator>
					<view class="btn">
						<!-- 11 -->
						<u-button plain text="加入购物车" color="#950000"></u-button>
						<u-button text="删除商品" color="#950000" ></u-button>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
	import {
		getAProductList
	} from "@/apis/index.js"
	import {
		ref
	} from "vue"
	import {
		onLoad
	} from '@dcloudio/uni-app'

	let activeTab = ref('全部')
	let productlist = ref([])
	const changeTab = (tab) => {
		activeTab.value = tab;
	}
	onLoad(async () => {
		const res = await getAProductList({
			cid: 105,
			size: 20
		})
		productlist.value = res.Data.Items
		console.log(productlist.value);
	})
</script>

<style lang="scss" scoped>
	.order {
		width: 100%;

		.tabs {
			width: 100%;
			display: flex;

			.item {
				width: 20%;
				height: 80rpx;
				line-height: 80rpx;
				box-sizing: border-box;
				padding: 0 20rpx;
				text-align: center;

			}

			.active {
				border-bottom: 4rpx solid #950000;
			}
		}
		.con {
			width: 100%;
			background-color: #f5f5f5;
			height: 90vh;

			.product-view2 {
				background-color: #fff;
				.product-view2-item{
					position: relative;
				.btn{
					position: absolute;
					bottom: 0;
					right: 10rpx;
					display: flex;
					.u-button{
						margin: 0 10rpx;
					}
				}
				.product-view2-box {
					display: flex;
					position: relative;
					padding: 20rpx;
					border-bottom: 1px solid #ededed;

					.product-img {
						width: 150rpx;
						height: 150rpx;
						margin-right: 30rpx;
						margin-top: 10rpx;

						image {
							width: 100%;
							height: 100%;
						}
					}

					.pruduct-info {
						width: 400rpx;
						display: flex;
						padding-top: 10px;
						flex-direction: column;
						justify-content: space-between;

						.product-t {
							display: flex;
							flex-direction: column;

							.product-name {
								font-size: 30rpx;
								line-height: 1.2;
							}

							.product-srot {
								flex: 1;
								overflow: hidden;
								text-overflow: ellipsis;
								white-space: nowrap;
							
								word-break: break-all;
							}
						}

						.price {
							line-height: 1.2;

							.product-price {
								font-size: 30rpx;
								line-height: 1.2;
								color: #950000;
							}
						}
					}

					.product-view2 .product-balance {
						position: absolute;
						bottom: 20rpx;
						right: 30rpx;
					}
				}
			
				}
			}

		}
	}
</style>