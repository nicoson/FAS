
## API 说明

HOST: 15.15.15.72
PORT: 8080

> 暴恐检测

Request

```
POST /v1/terrordetect  Http/1.1
Content-Type: application/json

{
	"data": {
		"uri": "https://assets.academy.com/mgen/71/20039771.jpg" 
	}
}
```

***请求字段说明:***

|字段|取值|说明|
|:---|:---|:---|
|uri|string|图片资源地址|


Response

```
200 ok

{
	"code": 0,
	"message": "",
	"result": {
		"detections": [
			{
				"index": 1,	  
				"class": "guns",
				"score": 0.997133,
				"pts": [[225,195], [351,195], [351,389], [225,389]]
			},
			{
				"index": 1,	  
				"class": "knives",
				"score": 0.997133,
				"pts": [[225,195], [351,195], [351,389], [225,389]]
			}
			...
		]
	}	
}
```

***返回字段说明：***

|字段|取值|说明|
|:---|:---|:---|
|code|int|0:表示处理成功；不为0:表示出错|
|message|string|描述结果或出错信息|
|index|int|暴恐类别的编号|
|class|string|暴恐类别名称{\_\_background__,islamic flag,isis flag,tibetan flag,knives,guns,BK_LOGO_1,BK_LOGO_2,BK_LOGO_3,BK_LOGO_4,BK_LOGO_5,BK_LOGO_6}|
|score|float|物体检测框的准确度，取值范围0~1，1为准确度最高|
|pts|四点坐标值|[左上，右上，右下，左下]四点坐标框定的暴恐物体|

