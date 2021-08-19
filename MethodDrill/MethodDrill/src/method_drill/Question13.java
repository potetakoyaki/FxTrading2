package method_drill;


public class Question13 {
	
	public static void main(String[] args) {
		Person[] persons = new Person[2];
				persons[0] = new Person(20);
				persons[1] = new Person(30);
				persons[2] = new Person(40);
		System.out.println(getYoungestPerson(persons).getAge());
	}
    
	static Person getYoungestPerson(Person[] persons) {
		Person minAge = persons[0];
		for(int i = 0; i < persons.length; i++) {
			if(minAge.getAge() >= persons[i].getAge()) {
				minAge = persons[i];
			}
		}
		return minAge;
	}
}