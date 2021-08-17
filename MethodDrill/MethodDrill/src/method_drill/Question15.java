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

	    void setAge(int age) {
		if (age >= 0) {
			this.age = age;
		}
	}
}