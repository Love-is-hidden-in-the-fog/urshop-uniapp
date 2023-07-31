<template>
	<view class="container" v-if="showData" >
		<view class="swiper">
			<u-swiper height="750" keyName="BigUrl" @click="click" @change="change" :list="swiperList"></u-swiper>
		</view>
		<view class="price-showBox">
			<view class="price-flex">
				<text class="price-new">{{GoodData.Price}}</text>
				<text class="price-type">({{newrolename ? newrolename : '会员'}}价)</text>
				<text class="price-old" v-if="GoodData.OldPrice !== '¥0.00'">{{GoodData.OldPrice}}</text>
				<button open-type="share" class="fenx" ><u-icon color="#930009" name="share"></u-icon>分享</button>
			</view>
		</view>
		<text class="title black">{{GoodData.Name}}</text>
		  <view class="pro-info-foter">
		    <view class="info-list">
		      <u-icon name="tags-fill"></u-icon>
		      <text>已售: {{GoodData.SaleVolume}}</text>
		    </view>
		    <view class="info-list">
			  <u-icon name="file-text-fill"></u-icon>
		      <text>库存: {{GoodData.StockQuantity}}</text>
		    </view>
		    <view class="info-list">
		      <u-icon name="car"></u-icon>
		      <text>广东发货</text>
		    </view>
		  </view>
		  <text class="pro-Short" wx:if="{{false}}">{{GoodData.Short}}</text>
		<view class="specs-select" @click="showSku">
		  <text>选择 · 规格</text>
		  <u-icon name="arrow-right"></u-icon>
		</view>
		<u-popup  :show="show" @close="close" customStyle="padding:40rpx 20rpx ;" >
			<view>
				<view class="item" style="margin-bottom: 70rpx;"  >
					<view style="margin-bottom: 30rpx;">
						{{GoodData.Attrs[0].Name}}
					</view>
					<text style="border: 1rpx solid #ccc; padding: 10rpx 20rpx ; margin-right: 20rpx;" >{{GoodData.Attrs[0].Values[0].Name}}</text>
					<text style="border: 1rpx solid #ccc; padding: 10rpx 20rpx ; margin-right: 20rpx;" >{{GoodData.Attrs[0].Values[1].Name}}</text>
				</view>
				<view class="item" style="margin-bottom: 70rpx;" >
					<view style="margin-bottom: 30rpx;" >
						{{GoodData.Attrs[1].Name}}
					</view>
					<text style="border: 1rpx solid #ccc; padding: 10rpx 20rpx ; margin-right: 20rpx;" >{{GoodData.Attrs[1].Values[0].Name}}</text>
					<text style="border: 1rpx solid #ccc; padding: 10rpx 20rpx ; margin-right: 20rpx;" >{{GoodData.Attrs[1].Values[1].Name}}</text>
				</view>
				<view class="item" style="margin-bottom: 70rpx;" >
					<view >
						数量<text style="font-size: 15rpx; color: #ccc; " >(库存剩余{{GoodData.StockQuantity}})</text>
					</view>
					
					<view style="padding-left: 402rpx; height: 60rpx; " >
						  <u-number-box style="border: 1rpx solid #848484 ; height: 60rpx; justify-content: space-between; " 
						   iconStyle=" padding:22rpx 22rpx ; border: 1rpx solid #848484; backgroundColor:#ccc;" button-size="40"  bgColor="#fff" :min="1" :max="100" v-model="value" @change="valChange"></u-number-box>
					</view>
				</view>
				<view class="item" style="margin-bottom: 100rpx;" >
					<view >
						价格
					</view>
					<text style="position: absolute; right: 20rpx; color: red; " >￥</text>
				</view>
			</view>
		</u-popup>
		<view class="product_con" >
			<rich-text :nodes="GoodData.Full" ></rich-text>
			<!-- <view v-html="full"></view> -->
		</view>
		<!-- 固定底部 -->
		<view class="buy_footer">
			<view class="list collect" @click="goHome">
			      <u-icon size="40" name="kefu-ermai"></u-icon>
			      <text class="ft-text">客服</text>
			      <button open-type="contact" class="kefu-btn" @contact="contactCallback"></button>
			</view>
			<view class="list collect" @click="goHome">
			      <u-icon size="40" name="home"></u-icon>
			      <text class="ft-text">首页</text>
			</view>
			<navigator open-type="switchTab" url="/pages/cart/cart" class="list cart">
			      <u-icon size="40" name="shopping-cart"></u-icon>
			      <text class="ft-text">购物车</text>
			      <text class='cart-numb'>0</text>
			</navigator>
			<view class='footr-butn' v-if="GoodData.Published && GoodData.StockQuantity !=0">
			  <button type='button' class="btn-cart" @click="addCart">加入购物车</button>
			  <button type='button' class="btn-buy" @click="buyBtn">立即购买</button>
		   </view>
			<view class='footr-butn' v-if="!GoodData.Published && GoodData.StockQuantity == 0">
			  <button type='button' class="jjkm">商品已售罄</button>
			</view>
			<view class='footr-butn' v-if="!GoodData.Published && GoodData.StockQuantity != 0">
			  <button type='button' class="jjkm">商品已下架</button>
			</view>
			<view class='footr-butn' v-if="GoodData.Published && GoodData.StockQuantity == 0">
			      <button type='button' class="jjkm">商品即将开卖</button>
			</view>
		
		</view>
	</view>
	<view class="container" v-else >
		<h1>商品已下架</h1>
	</view>
</template>

<script setup>
	import { onLoad } from '@dcloudio/uni-app'
	import {ref} from "vue"
	import {getbyidList} from "@/apis/detail.js"
	// 轮播图数据
	let swiperList =ref([])
	// 商品数据
	let GoodData=ref({})
	let newrolename=ref("")
	let value=ref(10)
	// 判断有无数据
	let showData=ref(true)
	// 商品详情图片数据
	let productHtml=ref("")
	const click=(e)=>{console.log(e)}
	const change=(e)=>{
		// console.log(e)
	}
	const valChange=(e)=>{console.log(e)}
	const showSku=()=>{
		show.value=true
	}
	const close=()=>{
		show.value=false
	}
	const contactCallback = (e) => {
		// console.log(e);
	}
	const addCart = (e) => {
		// 将数据缓存到本地 
		// 如果本地已有该条数据则加一否则添加
		console.log(GoodData.value)
		let goodsinfo=GoodData.value
		let cart =uni.getStorageSync("cart")||[]
		console.log(cart)
		// 查找当前商品是否在之前添加过
		let index =cart.findIndex(item=>item.Id==goodsinfo.Id)
		// 如果已存在则原来的num+1
		if(index!==-1){
			cart[index].num++
		}else{
			// 不存在则添加该条数据
			goodsinfo.num=1
			goodsinfo.checked=true
			cart.push(goodsinfo)
		}
		// 将缓存中cart更新
		uni.setStorageSync("cart",cart)
		uni.showToast({
			icon:"success",
			title:"添加成功"
		})
	}
	const buyBtn = (e) => {
		// console.log(e);
	}
	const goHome=()=>{
		wx.switchTab({
		      url: '/pages/index/index',
		})
	}
	let show =ref(false)
	let full =ref()
	onLoad(async(option)=>{
		console.log(option);
		await Promise.all([
			await getbyidList({id:option.id})
		]).then(([res1])=>{
			GoodData.value=res1.Data
			// 将图片标签修改
			full.value=GoodData.value.Full.replace(/<img/g, "<image")
			// full.value=GoodData.Full.replace("</img>", "</image>")
			console.log(full.value)
			if(GoodData.value==null){
				showData.value=false
			}
			swiperList.value=res1.Data.Pictures
		}).catch(err=>{
			console.log(err);
			showData.value=false
		})
	})
</script>

<style lang="scss" scoped >
.swiper{
	position: relative;
	height: 750rpx;
}
.price-showBox {
    background: #fff;
    padding: 12rpx 30rpx;
	.price-flex {
	    position: relative;
	    line-height: 1.3;
		.price-new {
		    font-size: 48rpx;
		    font-weight: bold;
		    color: #930009;
		}
		.price-type {
		    font-size: 32rpx;
		    margin-right: 20rpx;
		    color: #930009;
		}
		.price-old {
		    text-decoration: line-through;
		    color: #ccc;
		}
		.fenx {
			display: flex;
		    position: absolute;
		    right: 0rpx;
		    top: 50%;
		    transform: translateY(-50%);
		    font-size: 30rpx;
		    text-align: center;
		    color: #930009;
		    background-color: transparent;
		    padding: 0;
		    letter-spacing: 3rpx;
		}
	}
}
.title {
    font-size: 30rpx;
    padding: 0 20rpx 20rpx 20rpx;
    display: block;
    line-height: 1.2;
    background-color: #fff;
    font-weight: bold;
	color: #333;
}
.pro-info-foter {
    font-size: 24rpx;
    color: #ccc;
    display: flex;
    justify-content: space-between;
    padding: 0 40rpx 20rpx 40rpx;
    background-color: #fff;
	.info-list{
		display: flex;
		width: 23%;
		align-items: center;
		justify-content: space-evenly;
	}
}
.specs-select {
    height: 84rpx;
    background-color: #fff;
    margin-top: 10rpx;
    padding: 0 30rpx;
    color: #555;
    font-size: 30rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.buy_footer {
    position: fixed;
    z-index: 10076;
    height: 95rpx;
    width: 100%;
    bottom: 0rpx;
	right: -1rpx;
    background-color: #fff;
    box-shadow: 0px 0px 10px #eee;
    overflow: hidden;
    display: flex;
	.u-icon--right{
		justify-content: center;
	}
	.buy_footer .list {
	    position: relative;
	    display: flex;
	    flex-direction: column;
	    justify-content: center;
		.ft-text {
		    font-size: 24rpx;
		    color: #666;
		}
	}
	.collect {
	    vertical-align: top;
	    text-align: center;
	    font-size: 30rpx;
	    // display: inline-block;
	    height: 95rpx;
	    width: 100rpx;
	    padding-bottom: 15rpx;
	}
	.cart {
	    position: relative;
	    vertical-align: top;
	    display: inline-block;
	    height: 95rpx;
	    text-align: center;
	    font-size: 30rpx;
	    width: 100rpx;
	    padding-bottom: 15rpx;
		.cart-numb {
		    position: absolute;
		    top: 5rpx;
		    right: 5rpx;
		    background: red;
		    border-radius: 50%;
		    line-height: 30rpx;
		    color: #fff;
		    padding: 0 10rpx;
		    font-size: 20rpx;
		}
	}
	.footr-butn {
	    position: relative;
	    width: 550rpx;
		display: flex;
		button {
		    color: #fff;
		    height: 95rpx;
		    line-height: 95rpx;
		    text-align: center;
		    border-radius: 0px;
		    padding: 0;
		    font-size: 14px;
		}
		.jjkm {
		    background-color: #fa8c23;
			width: 100%;
		}
		.btn-cart {
			width: 50%;
		    background-color: rgb(255, 149, 0);
		}
		.btn-buy {
			width: 50%;
		    background-color: rgb(221, 39, 39);
		}
	}

}
.product_con{
	width: 100%;
		 img{
		     width: 100%;
		 }

}

</style>
