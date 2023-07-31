<template>
	<view>
		<rich-text :nodes="data"></rich-text>
	</view>
</template>

<script setup>
 import{getAboutus} from "@/apis/index.js"
 import { onLoad } from '@dcloudio/uni-app'
 import {ref} from "vue"
 let data=ref()
 onLoad(async(option)=>{
	 // console.log(option)
	 const res =await getAboutus({systemName:option.name})
	 data.value=res.Data.Body
	 // console.log(data.value)
	  uni.setNavigationBarTitle({
	       title: res.Data.Title
	     });
 })
</script>

<style scoped>
img{
	width: 100%;
}
</style>
