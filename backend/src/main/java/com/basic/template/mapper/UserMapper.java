package com.basic.template.mapper;

import com.basic.template.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper {

    User findByUsername(String username);

    User findById(Long id);
}
