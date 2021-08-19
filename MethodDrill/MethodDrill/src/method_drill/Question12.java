package method_drill;

public class Question12 {
	
	public static void main(String[] args) {
		Person person = new Person(20);
		System.out.println(isAdult(person));
	}
	
	static boolean isAdult(Person person) {
		if(person.getAge() >= 20) {
			return true;
		} else {
			return false;
		}
	}
}