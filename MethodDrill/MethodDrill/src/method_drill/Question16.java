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

     boolean isSameAge(Person person) {
		if (this.age == person.getAge()) {
			return true;
		} else {
			return false;
		}
	}

}