package method_drill;

class Person {
	private String name;
	
	Person(String name) {
      this.name = name;
    }
    String getName() {
      return name;
    }
} 

public class Question11 {
	
	public static void main(String[] args) {
		Person person = new Person("田口");
		printMessage(person);
	}
  
	static void printMessage(Person person) {
		System.out.println("こんにちは" + person.getName() + "さん");
	}
}