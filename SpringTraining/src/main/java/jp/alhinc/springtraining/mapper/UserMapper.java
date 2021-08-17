package jp.alhinc.springtraining.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import jp.alhinc.springtraining.entity.User;

@Mapper
public interface UserMapper {

	List<User> findAll();

	int create(User entity);

}
