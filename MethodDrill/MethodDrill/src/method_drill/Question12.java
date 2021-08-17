package method_drill;

class Person {
	private int age;
	
	Person(int age) {
    	    this.age = age; 
    }
        int getAge() {
             return age;
        }
} 

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