package com.basic.template.entity;

import lombok.Data;

@Data
public class User {

  private Long id;
  private String username;
  private String salt;
  private String password;
  private java.time.LocalDateTime createTime;
  private java.time.LocalDateTime updateTime;
}
