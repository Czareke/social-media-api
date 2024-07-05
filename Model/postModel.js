const mongoose = require('mongoose')
const postSchema=new mongoose.Schema({
    title:{
        type:String,
        required:[true,'Enter a title']
    },
    content:{
        type:String,
        required:[true,'Enter a Post']
    },
    author:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:[true,'Enter the author']
    },
    image:{
        type:Object,
        default:null,
        properties:{
            public_id:{
                type:String
            },
            url:{
                type:String
            }
        }
    },
    likes:{
        type:Number,
        default:0
    },
    createdAt:{
        type:Date,
        default:Date.now(),
        select:false
    },
})
//method for adding likes
postSchema.methods.incrementLikes=async function(){
    this.likes++
    await this.save()
}
//methods for removing likes
postSchema.methods.removeLikes=async function(){
    if(this.likes>0){
        this.likes--
        }
        await this.save()
}
const Post=mongoose.model('Post',postSchema)

module.exports=Post