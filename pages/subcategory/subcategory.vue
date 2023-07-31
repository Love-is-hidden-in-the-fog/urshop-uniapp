<template>
<!-- <view class="subcategory-cont"> -->
<!--    <view class="subcategory-head">
      <text
        class="subcategory-item"
        v-for="item in subcatelist"
        :key="item.Id"
        :class="{ active: select === item.Id }"
        :data-id="item.Id"
        :data-tab="item.Id"
        @tap="switchClick"
      >
        {{ item.Name }}
      </text>
    </view> -->
	<u-tabs lineColor="#950000" lineWidth="50" lineHeight="10" :list="subcatelist" keyName="Name" @click="click" ></u-tabs>
   <scroll-view
      scroll-y
      class="subcategory-scroll"
      :class="{ 'top0': !subcatelist.length }"
      @scrolltolower="lower"
    >
      <view class="subcategory-cont-box">
        <navigator
          class="subcategory-list"
          :url="`/pages/detail/detail?id=${item.Id}`"
          v-for="(item, index) in subcateProduct"
          :key="index"
          :data-index="index"
        >
          <view class="subcategory-img">
            <image :src="item.Picture.BigUrl"></image>
          </view>
          <view class="subcategory-info">
            <text class="subcategory-name">{{ item.Name }}</text>
            <text class="subcategory-text">{{ item.Short }}</text>
            <text class="subcategory-price">{{ item.Price.Price }}</text>
          </view>
        </navigator>
      </view>
    </scroll-view>
  <!-- </view> -->
</template>

<script setup>
	import {onMounted, ref } from "vue"
	import { onLoad } from '@dcloudio/uni-app'
	import {getASubList,getFindbycid} from "@/apis/index.js"
	let subcatelist =ref([])
	let subcateProduct =ref([])
	onLoad(async (option) => {
	   console.log(option);
	   // subcatelist.value.push({name:option.name})
	   const subListRes = await getASubList({ catId: option.id });
	   console.log(subListRes.Data.length)
	   if(subListRes.Data.length!==0){
		   subcatelist.value=subListRes.Data
		   const findRes = await getFindbycid({ cid: subListRes.Data[0].Id, page: 1 });
		   console.log(findRes);
		   subcateProduct.value=findRes.Data.Items
	   }else{
		   const findRes = await getFindbycid({ cid: option.id, page: 1 });
		   console.log(findRes);
		   subcateProduct.value=findRes.Data.Items
	   }
	});
	const click =(item)=>{
		console.log(item);
	}
	const lower =(item)=>{
		console.log(item);
	}
	
</script>

<style lang="scss" scoped>
.subcategory-head {
    display: flex;
    border-bottom: 2rpx solid #ededed;
    overflow-x: auto;
	text.active {
	    border-bottom: 4rpx solid #D9232E;
	}
}
.subcategory-scroll {
    position: fixed;
    top: 180rpx;
    left: 0;
    right: 0;
    bottom: 0;
	.subcategory-cont-box {
	    display: flex;
	    flex-wrap: wrap;
		.navigator-wrap {
			    width: 49.5%;
		}
		.subcategory-list:nth-child(odd) {
		border-right: 2rpx solid #ededed;
		}
		.subcategory-list {
			
		    width: 100%;
		    border-bottom: 2rpx solid #ededed;
		    box-sizing: border-box;
			.subcategory-img {
			    width: 375rpx;
			    height: 375rpx;
			    position: relative;
				image {
				    width: 300rpx;
				    height: 300rpx;
				    position: absolute;
				    top: 50%;
				    left: 50%;
				    transform: translate(-50%, -50%);
				}
			}
			.subcategory-info {
			    line-height: 1;
			    text-align: center;
				text {
				    height: 28rpx;
				    display: block;
				    white-space: nowrap;
				    overflow: hidden;
				    text-overflow: ellipsis;
				    margin-bottom: 20rpx;
				    padding: 0 20rpx;
				}
				.subcategory-name {
				    font-size: 28rpx;
				}
				.subcategory-text {
				    font-size: 24rpx;
				    color: #5e5e5c;
				}
				.subcategory-price {
				    font-size: 28rpx;
				    color: #8f1d24;
				}
			}
		}
	}
}
</style>
