/*
 Navicat Premium Dump SQL

 Source Server         : postgresql
 Source Server Type    : PostgreSQL
 Source Server Version : 150014 (150014)
 Source Host           : localhost:5432
 Source Catalog        : basic_template
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 150014 (150014)
 File Encoding         : 65001

 Date: 07/12/2025 13:31:27
*/


-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS "public"."user";
CREATE TABLE "public"."user" (
  "id" int8 NOT NULL DEFAULT nextval('user_id_seq'::regclass),
  "username" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "salt" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "password" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "create_time" timestamp(6) NOT NULL,
  "update_time" timestamp(6) NOT NULL
)
;
COMMENT ON COLUMN "public"."user"."id" IS '主键（自增）';
COMMENT ON COLUMN "public"."user"."username" IS '用户名（唯一）';
COMMENT ON COLUMN "public"."user"."salt" IS '盐值';
COMMENT ON COLUMN "public"."user"."password" IS '加密密码（BCrypt）';
COMMENT ON COLUMN "public"."user"."create_time" IS '创建时间';
COMMENT ON COLUMN "public"."user"."update_time" IS '更新时间';
COMMENT ON TABLE "public"."user" IS '用户表';

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO "public"."user" VALUES (1, 'admin', '6498ff81e1dc6b82b698d60a39a9eb75030d9bb1a450113cd3727af4a3a6d12c', 'f76b6bda266dbf14a2843b8442f0f2b67ae0424d2ef158f57850f7a1ffa47159', '2025-10-24 19:35:43', '2025-10-24 19:35:51');

-- ----------------------------
-- Indexes structure for table user
-- ----------------------------
CREATE UNIQUE INDEX "uk_username" ON "public"."user" USING btree (
  "username" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table user
-- ----------------------------
ALTER TABLE "public"."user" ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");
