package method_drill;

public class Question03 {
	
	public static void main (String[]args) {
		printMessage("Hello", 5); 
	}
	
	static void printMessage(String message, int count) { 
		for(int i = 1; i <= count; i++) {
			System.out.println(message);
		}
	}
}