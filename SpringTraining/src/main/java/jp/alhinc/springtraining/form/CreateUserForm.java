package jp.alhinc.springtraining.form;

import java.io.Serializable;

public class CreateUserForm implements Serializable {

	private String name;

	private String rawPassword;

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getRawPassword() {
		return rawPassword;
	}

	public void setRawPassword(String rawPassword) {
		this.rawPassword = rawPassword;
	}

}
