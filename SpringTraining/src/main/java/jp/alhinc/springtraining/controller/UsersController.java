package jp.alhinc.springtraining.controller;

import java.util.List;

import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import jp.alhinc.springtraining.entity.User;
import jp.alhinc.springtraining.form.CreateUserForm;
import jp.alhinc.springtraining.service.CreateUserService;
import jp.alhinc.springtraining.service.GetAllUsersService;

@Controller
@RequestMapping("/users")
public class UsersController {

	@Autowired
	private GetAllUsersService getAllUsersService;

	@Autowired
	private CreateUserService createUserService;

	@GetMapping
	public String index(Model model) {
		List<User> users = getAllUsersService.getAllUsers();
		model.addAttribute("users", users);
		return "users/index";
	}

	@GetMapping("/create")
	public String create(Model model) {
		model.addAttribute("form", new CreateUserForm());
		return "users/create";
	}

	@PostMapping
	public String create(@Valid @ModelAttribute("form") CreateUserForm form, BindingResult result, Model model) {

		if (result.hasErrors()) {
			model.addAttribute("message", "残念");
			model.addAttribute("form", form);
			return "users/create";
		}

		createUserService.create(form);
		return "redirect:/users";
	}
}
