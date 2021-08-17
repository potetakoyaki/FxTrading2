package jp.alhinc.springtraining.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jp.alhinc.springtraining.entity.User;
import jp.alhinc.springtraining.form.CreateUserForm;
import jp.alhinc.springtraining.mapper.UserMapper;

@Service
public class CreateUserService {

	@Autowired
	private UserMapper mapper;

	@Transactional
	public int create(CreateUserForm form) {
		User entity = new User();
		entity.setName(form.getName());

		BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
		entity.setPassword(encoder.encode(form.getRawPassword()));

		return mapper.create(entity);
	}

}
