# basic_template
开发基本模版
# basic_template

## 项目介绍
`basic_template` 是一个包含前后端分离架构的基础开发模板，旨在为快速搭建Web应用提供完整的技术栈支持。项目前端基于Vue 3 + TypeScript + Element Plus构建，后端基于Spring Boot 3 + MyBatis开发，包含用户认证、API通信、数据库交互等基础功能模块，可直接作为中小型Web项目的开发起点。


## 目录结构
```
basic_template
├── backend                                                                 # 后端
│   ├── src
│   │   └── main
│   │       ├── java
│   │       │   └── com
│   │       │       └── basic
│   │       │           └── template                                        # 基本路径
│   │       │               ├── config                                      
│   │       │               │   ├── Constant.java                           # 常量配置
│   │       │               │   ├── RedisConfig.java                        # Redis配置
│   │       │               │   └── SaTokenConfig.java                      # sa-token配置
│   │       │               ├── controller                                  
│   │       │               │   ├── BaseController.java                     # 控制层基本类，所有控制层均需要继承该类
│   │       │               │   ├── CryptoController.java                   # 国密加密控制类
│   │       │               │   └── UserController.java                     # 用户控制类
│   │       │               ├── domain
│   │       │               │   ├── user                                    # 用户相关实体
│   │       │               │   │   ├── CreateResponse.java                 # 创建用户响应实体
│   │       │               │   │   └── LoginResponse.java                  # 登录响应实体
│   │       │               │   └── ApiResponse.java                        # 后端响应实体，所有后端返回值均需要该类包装
│   │       │               ├── entity              
│   │       │               │   └── User.java                               # 数据库用户实体
│   │       │               ├── filter
│   │       │               │   └── DecryptFilter.java                      # 加解密过滤器
│   │       │               ├── mapper
│   │       │               │   └── UserMapper.java                         # 用户持久化层
│   │       │               ├── service
│   │       │               │   ├── ex                                      # 服务层自定义异常类
│   │       │               │   │   ├── IncorrectPasswordException.java     # 密码错误异常
│   │       │               │   │   ├── ServiceException.java               # 服务层异常类基类，所有服务层自定义类均需要继承该类
│   │       │               │   │   └── UserNotExistException.java          # 用户不存在异常
│   │       │               │   ├── impl
│   │       │               │   │   └── IUserServiceImpl.java               # 用户服务层实现类
│   │       │               │   └── UserService.java                        # 用户服务层接口
│   │       │               ├── utils                                       # 工具类
│   │       │               │   ├── safety                                  # 安全相关工具类
│   │       │               │   │   ├── SM2Utils.java                       # SM2加解密
│   │       │               │   │   ├── SM3Utils.java                       # SM3加密
│   │       │               │   │   └── SM4Utils.java                       # SM4加解密
│   │       │               │   └── user                                    # 用户工具类
│   │       │               │       └── PasswordUtils.java                  # 密码工具类
│   │       │               ├── vo                                          # 前端请求实体
│   │       │               │   └── user
│   │       │               │       ├── ChangePasswordVo.java               # 修改密码请求实体
│   │       │               │       └── UserVo.java                         # 用户请求实体
│   │       │               ├── wrapper                                     # 包装器
│   │       │               │   ├── DecryptRequestWrapper.java              # 解密包装器
│   │       │               │   ├── EncryptResponseAdvice.java              # 加密包装起
│   │       │               │   └── Sm4KeyHolder.java                       # SM4处理
│   │       │               └── BasicTemplateApplication.java               # 后端启动类
│   │       └── resources                                                   # 静态资源路径
│   │           ├── mapper
│   │           │   └── UserMapper.xml                                      # 用户数据库映射文件
│   │           └── application.yml                                         # 后端配置文件
│   └── pom.xml                                                             # maven配置
├── frontend                                                                # 前端
│   ├── public                                                              # 公共静态文件
│   │   └── favicon.ico
│   ├── src                                                                 
│   │   ├── api                                                             # 前端请求后端api，所有请求都应该从这里触发
│   │   │   ├── api.ts                                                      # 前端请求配置，所有请求都需要配置在这个文件中
│   │   │   ├── crypto.ts                                                   # 国密加密请求
│   │   │   └── user.ts                                                     # 用户信息请求
│   │   ├── assets                                                          # 静态资源
│   │   │   └── images                                                      
│   │   │       └── logo.svg
│   │   ├── config                                                          # 前端配置信息
│   │   │   └── config.json                                                 # 配置
│   │   ├── hooks                                                           # vue3中hooks
│   │   │   └── user
│   │   │       └── useLoginValidator.ts                                    # 登录验证信息
│   │   ├── router                                                          # 路由
│   │   │   └── index.ts
│   │   ├── stores                                                          # pinia文件
│   │   │   ├── useCryptStore.ts                                            # 加解密pinia
│   │   │   └── useUserStore.ts                                             # 用户pinia
│   │   ├── types                                                           # 定义ts类型，理论上与后端搭配使用
│   │   │   ├── crypto                                                      # 加解密相关
│   │   │   │   └── Sm2PublicKeyResponse.ts                                 # SM2公钥响应类
│   │   │   ├── user                                                        # 用户相关类
│   │   │   │   ├── ChangePasswordRequest.ts                                # 修改密码请求类
│   │   │   │   ├── CreateUserRequest.ts                                    # 创建用户请求类
│   │   │   │   ├── CreateUserResponse.ts                                   # 创建用户响应类
│   │   │   │   ├── LoginRequest.ts                                         # 登录请求类
│   │   │   │   └── LoginResponse.ts                                        # 登录响应类
│   │   │   └── Response.ts                                                 # 响应类，所有后端返回类型理论上应该和这个类一致
│   │   ├── utils                                                           # 前端工具
│   │   │   ├── request                                                     # 请求相关
│   │   │   │   └── http.ts                                                 # http请求拦截，所有请求都要经过这里
│   │   │   ├── safety                                                      # 安全相关
│   │   │   │   └── SafetyUtils.ts                                          # 安全配置
│   │   │   └── utils.ts                                                    # 公共工具
│   │   ├── views                                                           # vue3路由对应页面
│   │   │   ├── home                                                        # 首页
│   │   │   │   └── HomePage.vue
│   │   │   └── login                                                       # 登录页
│   │   │       └── UserLogin.vue
│   │   ├── App.vue
│   │   └── main.ts
├── sql                                                                     # sql文件（Mysql）
│   └── user.sql
├── LICENSE                                                                 # 许可证
└── README.md                                                               # 介绍文件
```

## 安装与使用

### 环境要求
- 后端：JDK 17+、Maven（3.9.8+）、MySQL 8.0+、Redis
- 前端：Node.js 22.18.0+、npm


### 项目克隆
```bash
git clone https://github.com/wzy-warehouse/basic_template.git
cd basic_template
```

### 后端启动
1. 导入`sql`目录下的数据库脚本
2. 修改`application.yml`配置数据库、Redis 连接信息
3. 运行`BasicTemplateApplication.java`启动类

### 前端启动
```bash
cd frontend
npm install
npm run dev
```

### 访问系统
+ 前端地址：[http://localhost:5173](http://localhost:5173/)
+ 初始账号：admin 初始密码：admin@123

## 许可证
本项目基于 [MIT License](LICENSE) 开源，详情请查看LICENSE文件。