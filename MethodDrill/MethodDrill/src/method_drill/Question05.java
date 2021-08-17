package method_drill;

public class Question05 {
	
	public static void main(String[] args) {
		System.out.println(isEvenNumber(2));
	}
	
	static boolean isEvenNumber(int value) {
		if (value % 2 == 0) {
			return true;
		}else
			return false;
	}
}