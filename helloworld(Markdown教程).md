# ! <https://zhuanlan.zhihu.com/p/548119991>

# Hello World 之 Markdown 语法教程

(待插入的前言，包括我写这个的目的、Markdown的简介和用途)

(我还会进行知乎发布，用于插件功能的测试及效果预览，多数功能还未学完，所以会有很多缺陷)

(另外，发布到知乎上是使用的 " Zhihu On VSCode " 插件，部分功能并不齐全，发布后的效果并不与 VSCode 中的 " 侧边预览 " 一致)

> *大部分搬运的知乎大佬的资料出处:*
>
> [Markdown语法及原理从入门到高级（可能是全网最全）](https://zhuanlan.zhihu.com/p/99319314)
>
> [一看就懂的Markdown入门语法笔记（整理自Markdown cheat sheet）](https://zhuanlan.zhihu.com/p/111833946)

## 一、Markdown纯文本基本语法

### 1. 标题

Markdown 支持两种标题的语法，类 Setext 和类 Atx 形式。我在此处不介绍类 Setext 形式，仅介绍类 Atx 形式，因为它更为简洁。
类 Atx 形式是在行首插入 1 到 6 个 # ，分别对应 1 到 6 级标题，例如：

> # this is H1
>
> ## this is H2
>
> ###### this is H6

### 2. 字体

Markdown 使用星号 \* 和底线 \_ 作为标记强调字词的符号，用什么符号开启标签，就要用什么符号结束。我在此处不介绍底线 \_ 形式，仅介绍星号 \* 形式，因为它不区分全角半角，不用切换输入法。

特别注意，如果你的 \* 和 \_ 两边都有空白的话，它们就只会被当成普通的符号。如果要在文字前后直接插入普通的星号 \* 或底线 \_ ，最好使用反斜线 \ 。

> *斜体*
>
> **加粗**
>
> ***斜体加粗***
>
> ~~删除线~~
>
> ==高亮==
>
> <u>下划线</u>
>
> A^上角标^
>
> A~下角标~
>
> 脚注[^1]
>
> [^1]:这是一个脚注

### 3. 分割线

Markdown 可以在一行中用三个以上的星号、减号、底线来建立一个分隔线，行内不能有其他东西，也可以在星号或是减号中间插入空格。例如，下面每种写法都可以建立分隔线：

* * *
***
**********
- - -
_________________

### 4. 区块 (亦称 引用)

在引用的文字前加 > 即可。 在 Markdown 文件中建立一个区块引用，那会看起来像是你自己先断好行，然后在每行的最前面加上 > ，例如：

> This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet,
> consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.
> Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.
>
> Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse
> id sem consectetuer libero luctus adipiscing.

Markdown 也允许你偷懒只在整个段落的第一行最前面加上 > ，也可以不必自己断行，由页面大小决定断行，例如：

> This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.
>
> Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse id sem consectetuer libero luctus adipiscing.

区块引用可以嵌套（例如：引用内的引用），只要根据层次加上不同数量的 > ，例如：

> This is the first level of quoting.
>
> > This is nested blockquote.
> > >
> > > > Back to the first level.

### 5. 列表

Markdown 支持有序列表和无序列表。

==列表的换行问题目前我没有找到解决方法。==

#### 5.1. 无序列表

无序列表使用星号 \* 、加号 \+ 或是减号 \- 作为列表标记，注意 - + * 跟内容之间都要有一个空格，例如：

> - 列表内容
>
> - 列表内容
>
> - 列表内容
>
> *经实测，在VS Code里面，无序列表最好统一使用减号 \- ，不然会出建议修改的警告(易搞混)*

#### 5.2. 有序列表

有序列表则使用数字接着一个英文句点作为标记，注意序号跟内容之间要有一个空格，例如：

> 1. 列表内容
> 2. 列表内容
> 3. 列表内容
>
> *很重要的一点是，你在列表标记上使用的数字并不会影响输出的 HTML 结果。对于一个有序列表标记，先判断是否与前面的同级，若前面有且与之同级，则序号按前面的 +1 处理；否则，以该序号，作为第一个序号来排序。例如：*
> >
> > 1. 列表内容
> > 1. 列表内容
> > 1. 列表内容
> >
> > *或是：*
> > >
> > > 8. 列表内容
> > > 1. 列表内容
> > > 4. 列表内容

#### 5.3. 列表嵌套

列表可以嵌套，上一级和下一级之间敲至少 3 个空格即可区分，例如：

>- 一级无序列表内容
>   - 二级无序列表内容
>     - 三级无序列表内容
>     - 三级无序列表内容
>- 一级无序列表内容
>   - 二级无序列表内容
>   - 二级无序列表内容

#### 5.4. 其他

列表项目可以包含多个段落，每个项目下的段落都必须缩进 4 个空格或是 1 个制表符，例如：

>1. This is a list item with two paragraphs. Lorem ipsum dolor
    sit amet, consectetuer adipiscing elit. Aliquam hendrerit
    mi posuere lectus.
>
>     Vestibulum enim wisi, viverra nec, fringilla in, laoreet
    vitae, risus. Donec sit amet nisl. Aliquam semper ipsum
    sit amet velit.
>
>2. Suspendisse id sem consectetuer libero luctus adipiscing.
>
> *此处最重要的是 " Vestibulum " 前的空格数，为 1+4 ，1 是跟在 \> 后的，4 是段落缩进的，可以删去任意个试试效果，此处不作演示。*

### 6. 表格

| 表头 | 表头  | 表头 |
| :--- | :---: | ---: |
| 内容 | 内容  | 内容 |
| 内容 | 内容  | 内容 |

第二行分割表头和内容。减号 \- 有一个就行，如果是强迫症为了对齐，也可以多加了几个。文字默认左对齐，也可以在减号 \- 左边加冒号 \: ；在减号 \- 两边加冒号 \: ，表示文字居中；在减号 \- 右边加冒号 \: ，表示文字右对齐。

注：完整的表格语法应该两边均用 \| 包起来，但是可以省略。

<!-- 让表格居中显示的风格 -->
<style>
.center
{
  width: auto;
  display: table;
  margin-left: auto;
  margin-right: auto;
}
</style>
<div class="center">

| 表头 | 表头  | 表头 |
| :--- | :---: | ---: |
| 内容 | 内容  | 内容 |
| 内容 | 内容  | 内容 |

</div>

### 7. 代码

Markdown 中加入代码块有两种方式：

第一种，只要简单地缩进 4 个空格或是 1 个制表符就可以，例如：

>这是一个普通段落：
>
>     这是一个代码区块。

第二种(更常用)，分为单行代码与代码块两种。

单行代码：代码之间分别用一个反引号包起来即可，例如：

> 这里有一句代码`printf()`。

代码块：代码之间分别用三个反引号包起来，且两边的反引号单独占一行，例如：

>```C++
>    int main()
>    {
>     int a;
>     cin >> a;
>     cout << a << endl;
>     return 0;
>    }
>```
>
> *还可以在上面的 ``` 后面注明你的代码类型，可以产生相应的代码高亮。*

### 8. 段落和换行

(后续补充)

## 二、Markdown纯文本进阶语法

上面的语法其实基本的写一些东西已经足够用了，但有时候还想要文档看起来更炫一些，这时候需要一些用于排版的进阶语法，实际上，这里用的就是HTML的标签来实现了。

### 1. 更改字体、大小、颜色

例如：

1. 字体如下：

<font face="黑体">我是黑体字</font>

<font face="微软雅黑">我是微软雅黑</font>

<font face="STCAIYUN">我是华文彩云</font>

<font face="Times New Roman">abcdeA</font>

<font face="Courier New">abcdeA</font>

<font face="PMingLiU">A</font>

<font face="WTK">A</font>

<font face="Century Schoolbook">A</font>

<b>我是加粗黑体字</b>

1. 颜色如下：

由6为16进制数组成，每2位分别对应RGB(红绿蓝)，==(待补充)==

> <font color="#dd0000">浅红色文字</font>
> <font color="#660000">深红色文字</font>
>
> <font color="#00dd00">浅绿色文字</font>
> <font color="#006600">深绿色文字</font>
>
> <font color="#0000dd">浅蓝色文字</font>
> <font color="#000066">深蓝色文字</font>
>
> <font color="#dddd00">浅黄色文字</font>
> <font color="#666600">深黄色文字</font>
>
> <font color="#00dddd">浅青色文字</font>
> <font color="#006666">深青色文字</font>
>
> <font color="#dd00dd">浅紫色文字</font>
> <font color="#660066">深紫色文字</font>
>
> <font color="#dd6600">橙色文字</font><br />

1. 尺寸如下：

<font size=5>我是尺寸</font>

<font face="黑体" color=green size=5>我是黑体，绿色，尺寸为5</font>

### 2. 为文字添加背景色

由于 style 标签和标签的 style 属性不被支持，所以这里只能是借助 table, tr, td 等表格标签的 bgcolor 属性来实现背景色。故这里对于文字背景色的设置，只是将那一整行看作一个表格，更改了那个格子的背景色（bgcolor）。例如：

<table><tr><td bgcolor=green>背景色green</td></tr></table>

### 3. 设置文字居中

<center>居中</center>

<p align="center">居中</p>

<p align="left">左对齐</p>

<p align="right">右对齐</p>

### 4. 设置为Latex数学公式( ==还有很多，需深入== )

$p↔q$ 与 p↔q

$\underline{\text{下划线}}$

$\overline{\text{上划线}}$

### 5. 换行

文本编写中<br/>文本编写中

## 三、Markdown进阶使用

有时候在用Markdown时，我们不止要使用纯文本，还需要插入一些图片，链接等等，由于Markdown只是关注于纯文本，因此这些操作都要通过引用来完成，不像word里面简单的复制粘贴。

### 1. 超链接

#### 1.1. 内联超链接

方括号 \[ 文字 ] 里是超链接文字，紧跟着的圆括号 \( 链接地址 ) 里是 URL ，例如：

> [百度一下 ( 内联超链接 )](http://www.baidu.com)

#### 1.2. 引用超链接

在超链接文字的方括号 \[ 文字 ] 后面再接上另一个方括号\[ 标记 ]，而在第二个方括号里面要填入用以辨识链接的标记，标记可以是任意字符、数字或字符串，但是==并不区分大小写==。接着，在文件的==任意处==，把这个标记的链接地址定义出来，链接地址也可以用尖括号 \< > 包起来。例如：

[百度一下 ( 引用超链接 )][URL_1]

[URL_1]: http://www.baidu.com

也可以不使用标记，直接展示 URL 文字内容 \[ 文字 ] ，在段落底用相同的内容绑定 URL [ 文字 ]: xxx 。例如：

[知乎 ( 不使用标记且只用到一对方括号 )]

[知乎 ( 不使用标记 )][]

[知乎 ( 不使用标记且只用到一对方括号 )]: http://www.zhihu.com

[知乎 ( 不使用标记 )]: http://www.zhihu.com

#### 1.3. 最简单的超链接

尖括号里的 URL 可以直接转换成超链接，例如：

<http://www.zhihu.com>

### 2. 图片

(未完待续)

## 四、其他

### 1. 箭头

单向箭头：
↑、↓、→、←、↗、↙、↖、↘

双向箭头：

↔、$↔$、↕、$↕$

双线箭头：

⇈、$⇈$、⇊、$⇊$、⇉、$⇉$、⇇、$⇇$、⇐、$⇐$、⇑、$⇑$、⇒、$⇒$、⇓、$⇓$

双线双向箭头：

⇌、$⇌$、⇋、$⇋$、⇔、$⇔$、⇄、$⇄$、⇆、$⇆$
