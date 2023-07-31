<template>
	<view class="cart">
		<view class="empty" v-if="cartList.length==0">
			<u-icon color="#ccc" size="200" name="shopping-cart"></u-icon>
			<view class="text">
				<text>购物车还是空的</text>
				<u-button @click="gocategory" color="#950000" text="去逛逛"></u-button>
			</view>
		</view>
		<view class="container" v-else>
			<view class="cart_item" v-for="(item,index) in cartList" :key="index">
				<!-- 复选框 -->
				<view class="cart_chk_wrap">
					<checkbox-group @change="handleItemChange(index)">
						<checkbox :checked="item.checked"></checkbox>
					</checkbox-group>
				</view>
				<!-- 图片 -->
				<navigator class="cart_image_wrap" :url="`/pages/detail/detail?id=${item.Id}`">
					<!-- <image  :src="item.Pictures[0].BigUrl"></image> -->
					<u--image :showLoading="true" :src="item.Pictures[0].BigUrl" width="180rpx"
						height="180rpx"></u--image>
				</navigator>
				<!-- 文字介绍、单价 -->
				<view class="cart_info_wrap">
					<view class="goods_name">{{item.Name}}</view>
					<view class="goods_price_wrap">
						<view class="goods_price">{{item.Price}}</view>
						<view class="cart_num_tool">
							<view @click="editor(1,index)" class="num_edit">-</view>
							<view class="goods_num">{{item.num}}</view>
							<view @click="editor(0,index)" class="num_edit">+</view>
						</view>
					</view>
				</view>
				<!-- 商品数量 -->
			</view>
		</view>
			<!-- 底部工具栏 -->
		<view class="footer_tool">
				<!-- 全选 -->
				<view class="all_chk_wrap">
					<checkbox-group @change="handleItemAllCheck">
						<checkbox :checked="allChecked">全选</checkbox>
					</checkbox-group>
				</view>
				<!-- 总价格 -->
				<view class="total_price_wrap">
					<view class="total_price">
						合计：<text class="total_price_text">{{totalPrice}}</text>
					</view>
					<view>包含运费</view>
				</view>
				<!-- 结算 -->
				<view class="order_pay_wrap" bindtap="handlePay">
					结算（{{totalNum}}）
				</view>
			</view>	
		
	</view>
</template>

<script setup>
	import {
		ref
	} from "vue"
	import {
		onLoad,
		onShow
	} from '@dcloudio/uni-app'
	const gocategory = (e) => {
		uni.switchTab({
			url: "../category/category"
		})
	}
	let cartList = ref([])
	let allChecked = ref(false)
	let totalPrice = ref(0)
	let totalNum = ref(0)
	// 点击全选选中所有复选框
	const handleItemAllCheck = (e) => {
		allChecked.value = !allChecked.value
		cartList.value.forEach(item => {
			item.checked = allChecked.value
		})
		console.log(allChecked.value)
		// 计算价格
		gettotal(cartList.value)
	}
	// 点击单个复选框，当全部选中则全选框选中
	const handleItemChange = (index) => {
		// 根据id来修改状态
		cartList.value[index].checked = !cartList.value[index].checked
		// 当所有都为true则全选框为true
		let i = cartList.value.findIndex(item => item.checked === false)
		if (i == -1) {
			allChecked.value = true
		} else {
			allChecked.value = false
		}
		// 计算价格
		gettotal(cartList.value)
	}
	// 加减修改数量
	const editor = (choose, index) => {
		if (choose == 0) {
			cartList.value[index].num++
		} else {
			cartList.value[index].num--
			// 当数据没了就清除那一项
			if (cartList.value[index].num == 0) {
				cartList.value.splice(index, 1)
			}
		}
		// 将数据更新到缓存
		uni.setStorageSync("cart", cartList.value)
		gettotal(cartList.value)
	}

	// 计算价格和数量
	const gettotal = (cartList) => {
		// 计算数量
		totalNum.value = 0
		totalPrice.value = 0.00
		cartList.forEach(item => {
			// 只有勾选了的才计算
			if (item.checked == true) {
				totalNum.value += item.num
				let price = item.Price
				price = parseFloat(price.replace("¥", ""));
				totalPrice.value += item.num * price
			}
		})
		totalPrice.value = totalPrice.value.toFixed(2)
	}
	onShow(() => {
		cartList.value = uni.getStorageSync("cart")
		console.log(cartList.value)
		let i = cartList.value.findIndex(item => item.checked === false)
		if (i == -1) {
			allChecked.value = true
		} else {
			allChecked.value = false
		}
		// 计算价格
		gettotal(cartList.value)

	})
</script>

<style lang="scss">
	page,
	view,
	text,
	swiper,
	swiper-item,
	image,
	navigator {
		padding: 0;
		margin: 0;
		box-sizing: border-box;
	}

	.empty {
		width: 100%;
		height: 300rpx;
		padding: 30rpx 140rpx;
		box-sizing: border-box;
		display: flex;
		justify-content: space-evenly;

		.text {
			color: #a3a3a3;
			margin-right: 0.9375rem;
			white-space: nowrap;
			padding: 18px 0;
			display: flex;
			flex-direction: column;
			justify-content: space-evenly;
		}
	}

	.cart_item {
		display: flex;
		padding: 50rpx 40rpx;
		border-bottom: 1px solid #ccc;

		.cart_chk_wrap {
			width: 5%;
			display: flex;
			justify-content: center;
			align-items: center;
		}

		.cart_image_wrap {
			width: 25%;
		}

		.cart_info_wrap {
			width: 65%;
			display: flex;
			flex-direction: column;
			justify-content: space-around;

			.goods_name {
				display: -webkit-box;
				overflow: hidden;
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 2;
				color: #666;
			}

			.goods_price_wrap {
				display: flex;
				justify-content: space-between;

				.goods_price {
					font-size: 36rpx;
					color: rgba(248, 11, 11, 0.945);
				}

				.cart_num_tool {
					display: flex;

					.num_edit {
						width: 55rpx;
						height: 55rpx;
						display: flex;
						justify-content: center;
						align-items: center;
						border: 1rpx solid #666;
					}

					.goods_num {
						width: 55rpx;
						height: 55rpx;
						display: flex;
						justify-content: center;
						align-items: center;
					}
				}
			}
		}
	}

	.footer_tool {
		position: fixed;
		bottom: 100rpx;
		left: 0;
		width: 100%;
		height: 90rpx;
		background-color: #fff;
		display: flex;
		border-top: 1px solid #ccc;

		.all_chk_wrap {
			flex: 2;
			display: flex;
			justify-content: center;
			align-items: center;
		}

		.total_price_wrap {
			flex: 5;
			padding-right: 15rpx;
			text-align: right;

			.total_price {
				.total_price_text {
					color: red;
				}

			}
		}

		.order_pay_wrap {
			flex: 3;
			background-color: #950000;
			color: #fff;
			font-size: 32rpx;
			font-weight: 600;
			display: flex;
			justify-content: center;
			align-items: center;
		}
	}
</style>