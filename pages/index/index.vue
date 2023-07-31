<template>
	<view class="index"  >
		<navigator url="/pages/options/options" class="address">
			<text class="line marb">当前分店：{{AdresList.Name}}</text>
			<text class="line">分店地址：{{AdresList.Remark}}</text>
			<u-icon name="arrow-right"></u-icon>
		</navigator>
		<view class="search">
			<u-search @search="search" bgColor="#fff" :show-action="false" :clearabled="true" shape="round"
				placeholder="搜一搜"></u-search>
		</view>
		<!-- 轮播图 -->
		<view class="swiper">
			<swiper class="swiper" circular  autoplay >
				<swiper-item v-for="(item,index) in bannerList"  :key="index" >
					<view class="swiper-item uni-bg-red"  >
						<navigator :url="item.Url">
							<image :src="item.Picture.BigUrl" ></image>
						</navigator>
					</view>
				</swiper-item>
			</swiper>
		</view>
		<view class="wxParse">

		</view>
		<view class='short-list'>
			<view class='list-item' v-for="(item,index) in CategortList" :key='index'>
				<navigator class="pic" :url="`/pages/subcategory/subcategory?id=${item.Id}&name=${item.Name}`" role="navigation">
					<view class='shop-img'>
						<image :src='item.Picture.BigUrl'></image>
					</view>
					<text>{{item.Name}}</text>
				</navigator>
			</view>
		</view>

		<view class='banner'>
			<!-- @click="bannerHref" -->
			<view class='banner-img' v-if="bannerList2" >
				<image :src="bannerList2.BigUrl"></image>
				<view class='btn' hidden>立即领取</view>
			</view>
		</view>
		 <view class='hot-intro' v-if="productlist.Items&&productlist.Items.length">{{productlist.Name}}<navigator url='/pages/subcategory/subcategory?id={{productlist.Id}}' class="group-list-btn">查看更多 > </navigator></view>
	
		  <view class="product-view2">
		    <navigator v-for="(item, index) in productlist.Items" :key="index" :url="`/pages/detail/detail?id=${item.Id}`" class="product-view2-box">
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
		          <span class="product-oldprice" v-if="item.Price.OldPrice !== '¥0.00'">{{ item.Price.OldPrice }}</span>
		        </view>
		      </view>
		    </navigator>
		  </view>
		  <view class='intro'>
		        <image src='https://7769-windtest1-4gjy5wl0d7f80453-1309457816.tcb.qcloud.la/huihua.png'></image>
		        <button open-type="contact" class="kefu-btn" @contact="contactCallback"></button>
		   
		  </view>
	</view>
</template>

<script setup>
	import {
		ref,
		onBeforeMount
	} from "vue"
	import { onLoad } from '@dcloudio/uni-app'
	import {
		getABannerList,
		getABannerList2,
		getACategortList,
		getAProductList
	} from "@/apis/index.js"
	const AdresList = ref({
		Name: "新地区",
		Remark: "的撒"
	})
	const keyword = ref()

	const search = (e) => {
		uni.navigateTo({
			url:`../search/search?value=${e}`
		})
	}
	const contactCallback = (e) => {
		console.log(e);
	}

	// 轮播
	const bannerList = ref([])
	const bannerList2 = ref([])
	const CategortList = ref([])
	const productlist = ref([]) //热销
	
	onLoad(async () => {
		// const rs = await uni.request({
		// 	url:"http://demo.urshop.cn/api/v1/common/banner",
		// 	data:{name:"homehotbanner"}
		// })
		// 轮播图数据
		await Promise.all([
		  getABannerList({ name: "homehotbanner" }),
		  getABannerList2({ name: 'homehotbanner-second-mobile' }),
		  getACategortList("homecategories"),
		  getAProductList({cid: 105,size:20})
		]).then(([bannerRes, banner2Res, categoryRes,productlistres]) => {
			console.log(bannerRes)
		  // 处理每个异步请求的结果
		  bannerList.value = bannerRes.Data.Items;
		  bannerList2.value = banner2Res.Data.Items[0].Picture;
		  CategortList.value = categoryRes.Data;
		  productlist.value = productlistres.Data;
		}).catch(err => {
		  console.log(err);
		});

	});


	// CategortList
</script>

<style lang="scss" scoped>
	.address {
		display: block;
		background-color: #fff;
		padding: 15rpx 30rpx;
		position: relative;
		margin-top: 10rpx;
		margin-bottom: 10rpx;

		.line.marb {
			margin-bottom: 10rpx;
		}

		.line {
			display: block;
			line-height: 1.3;
		}

		.u-icon--right[data-v-ac70166d] {
			position: absolute;
			top: 33rpx;
			right: 25rpx;
			color: #999;
		}
	}

	.search {
		position: relative;
		height: 100rpx;
		box-sizing: border-box;
		padding: 20rpx 30rpx;
		background-color: #950000;

		.u-search {
			height: 60rpx;
		}
	}

	.swiper {
		height: 350rpx;
		overflow: hidden;
		box-shadow: 0 0 10rpx #ccc;
	}

	.wxParse {
		height: 68rpx;
		background-color: #950000;
	}

	.short-list {
		width: 100%;
		height: auto;
		padding: 15rpx 0;
		background-color: #fff;

		.list-item {
			width: 20%;
			display: inline-block;
			text-align: center;
			color: #555;

			.shop-img {
				width: 100rpx;
				height: 100rpx;
				overflow: hidden;
				margin: 0rpx auto;
				padding: 20rpx;

				image {
					width: 100%;
					height: 100%;
				}
			}

			text {
				display: block;
				font-size: 24rpx;
			}
		}
	}

	.banner {
		width: 100%;
		background: #edece8;
		margin: 10rpx 0;

		.banner-img {
			width: auto;
			height: 180rpx;
			position: relative;
			background-color: #edece8;

			image {
				width: 100%;
				height: 100%;
			}
		}
	}

	.hot-intro {
	    margin-top: 10rpx;
	    padding: 15rpx 28rpx;
	    font-size: 28rpx;
	    color: #333;
	    background-color: #fff;
		.group-list-btn {
			display: block;
		    position: relative;
		    float: right;
		    padding-right: 15px;
		}
	}
	
	.product-view2 {
	    background-color: #fff;
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
			    width: 520rpx;
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
					    display: -webkit-box;
					    -webkit-line-clamp: 2;
					    overflow: hidden;
					    text-overflow: ellipsis;
					    -webkit-box-orient: vertical;
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
	
	element.style {
	}
	.intro {
	    position: fixed;
	    bottom: 200rpx;
	    right: 40rpx;
	    width: 80rpx;
	    height: 80rpx;
	    border-radius: 50%;
	    border: 10rpx solid #000000;
	    background-color: #000000;
	    opacity: 0.5;
		image {
		    width: 40rpx;
		    height: 40rpx;
		    margin: 20rpx;
		}
		.kefu-btn {
		    position: absolute;
		    top: 0;
		    width: 80rpx;
		    height: 80rpx;
		    border-radius: 50%;
		    opacity: 0;
		}
	}
</style>