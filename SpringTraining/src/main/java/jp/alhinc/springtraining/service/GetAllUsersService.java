package jp.alhinc.springtraining.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jp.alhinc.springtraining.entity.User;
import jp.alhinc.springtraining.mapper.UserMapper;

@Service
public class GetAllUsersService {

	@Autowired
	private UserMapper mapper;

	@Transactional
	public List<User> getAllUsers() {
		return mapper.findAll();
	}

}
