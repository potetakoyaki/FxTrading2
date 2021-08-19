package method_drill;

class Person {
	private String name;
	private int age;

	Person(String name, int age) {
		this.name = name;
		this.age = age;
	}

	String getName() {
		return name;
	}

	int getAge() {
		return age;
	}

	//Question14
	public void setName(String name) {
		this.name = name;
	}
	
	//Question15
	 public void setAge(int age) {
		if (age >= 0) {
			this.age = age;
		}
	 }
	
	//Question16
     boolean isSameAge(Person person) {
		if (this.age == person.getAge()) {
			return true;
		} else {
			return false;
		}
	}
}