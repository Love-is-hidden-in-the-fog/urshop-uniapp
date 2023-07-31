<template>
	<view>
		<view class="search">
			<u-search @search="search" bgColor="#fff" :show-action="false" :clearabled="true" shape="round"
				placeholder="搜一搜"></u-search>
		</view>
		<view class="cantainer">
			<scroll-view class="tabs">
			  <template v-for="(item, index) in sublist" :key="index">
			    <view class="item" @click="selectTab(index)" :class="{ 'selected': selected === index }" v-if="index !== 4">
			      {{ item.Name }}
			    </view>
			  </template>
			</scroll-view>
			<scroll-view scroll-y class="con">
				<template v-for="(item,index) in sublist " :key="index" >
					<view class="tabs_con" v-if="index !== 4 && selected==index " >
						<!-- 可使用字符串拼接使用cateProduct1来渐少代码量 -->
						<template v-if="index==1" v-for="(item1,index1) in cateProduct1 " :key="index1" >
							<navigator   :url="`/pages/subcategory/subcategory?id=${item1.Id}`"  role="navigation" class="item"  >
								<image lazy-load="true" :src="item1.ImageUrl"></image>
								<view class="text">
									{{item1.Name}}
								</view>
							</navigator>
						</template>
						<template v-if="index==0" v-for="(item2,index2) in cateProduct0 " :key="index2" >
							<navigator  :url="`/pages/detail/detail?id=${item2.Id}`"  role="navigation" class="item"  >
								<image lazy-load="true" :src="item2.Picture.NormalUrl"></image>
								<view class="text">
									{{item2.Name}}
								</view>
							</navigator>
						</template>
						<template v-if="index==2" v-for="(item2,index2) in cateProduct2 " :key="index2" >
							<navigator  :url="`/pages/detail/detail?id=${item2.Id}`"  role="navigation" class="item"  >
								<image lazy-load="true" :src="item2.Picture.NormalUrl"></image>
								<view class="text">
									{{item2.Name}}
								</view>
							</navigator>
						</template>
						<template v-if="index==3" v-for="(item2,index2) in cateProduct3 " :key="index2" >
							<navigator  :url="`/pages/detail/detail?id=${item2.Id}`"  role="navigation" class="item"  >
								<image lazy-load="true" :src="item2.Picture.NormalUrl"></image>
								<view class="text">
									{{item2.Name}}
								</view>
							</navigator>
						</template>
					</view>
					<view class="more" v-if="index !== 4 && selected==index " >
						<view v-if="index==0" style="text-align: center; padding: 10rpx; color: #3d3d3d; " >
							<navigator url="/pages/subcategory/subcategory?id=103" role="navigation">查看更多</navigator>
						</view>
						<view v-if="index==2" style="text-align: center; padding: 10rpx; color: #3d3d3d; " >
							<navigator url="/pages/subcategory/subcategory?id=244" role="navigation">查看更多</navigator>
						</view>
					</view>
				</template>
				
			</scroll-view>
		</view>
	</view>
</template>

<script setup>
	import {ref} from "vue"
		import { onLoad } from '@dcloudio/uni-app'
		import {getASubList,getFindbycid} from "@/apis/index.js"
		const search = (e) => {
			console.log(e);
		}
		let selected=ref(0)
		// 商品内容
		let cateProduct0=ref([])
		let cateProduct1=ref([])
		let cateProduct2=ref([])
		let cateProduct3=ref([])
		const selectTab = async (index) => {
			selected.value = index;
		};
		let sublist =ref([])
		onLoad(async () => {
			const subListRes = await getASubList()
			// console.log(subListRes);
			sublist.value=subListRes.Data
			// 页面刷新给第一个添加数据
			// console.log(sublist.value)
			await Promise.all([
				await getFindbycid({ cid: sublist.value[0].Id, page: 1 }),
				await getASubList({ catId:sublist.value[1].Id }),
				await getFindbycid({ cid: sublist.value[2].Id, page: 1 }),
				await getFindbycid({ cid: sublist.value[3].Id, page: 1 })
			]).then(([findRes0, findRes1, findRes2,findRes3]) => {
			  // 处理每个异步请求的结果
			  cateProduct0.value= findRes0.Data.Items
			  cateProduct1.value= findRes1.Data
			  cateProduct2.value= findRes2.Data.Items
			  cateProduct3.value= findRes3.Data.Items
			}).catch(err => {
			  console.log(err);
			});
		})
</script>
<style lang="scss" scoped >
/* 全局样式重置 */
navigator {
  all: unset; /* 取消所有默认样式 */
  /* 或者选择性地清除单个属性的默认样式 */
  text-decoration: none; /* 清除文本装饰下划线 */
}
a{
	list-style-type: none;
}
	.search {
		width: 101%;
		position: relative;
		height: 100rpx;
		padding: 20rpx 30rpx;
		box-sizing: border-box;
		background-color: #950000;
		.u-search {
			height: 60rpx;
		}
	}
	.cantainer{
		width: 101%;
		height: calc(85.5vh - 100rpx);
		display: flex;
		.tabs{
			width: 20%;
			// background-color: aqua;
			display: flex;
			flex-direction: column;

			.item{
				width: 100%;
				height: 100rpx;
				text-align: center;
				line-height: 100rpx;
				box-sizing: border-box;
			}
			.selected{
				border-left: 6rpx solid #950000;
				color:#950000;
			}
		}
		.con{
			width: 81%;
			.tabs_con{
				padding: 10rpx;
				display: flex;
				flex-wrap: wrap;
				text-align: center;
				.navigator-wrap {
				    width: 33%;
					}
				.item{
					// width: 33%;
					// height: 168rpx;
					image{
						width: 100%;
						height: 200rpx;
						margin-bottom: 10rpx;
					}
					.text{
						    font-size: 24rpx;
							white-space: nowrap;
							overflow: hidden;
							text-overflow: ellipsis;
							opacity: 0.7;
					}
				}
			}

		}
	}
	
</style>
