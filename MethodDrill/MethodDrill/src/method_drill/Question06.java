package method_drill;

public class Question06 {
	
	public static void main(String[] args) {
		System.out.println(getMinValue(2,2));
	}
	
	static double getMinValue(double a, double b) {
		if (a < b) {
			return a;
		} else
			return b;
	}

}