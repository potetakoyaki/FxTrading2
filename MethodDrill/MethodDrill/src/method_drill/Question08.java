package method_drill;

public class Question08 {
	
	public static void main(String[] args) {
		double[] array = {1.0, 2.0, 3.0};
		System.out.println(getAverage(array));
	}

	static double getAverage(double[] array) {
		double sum = 0;
		for(int i = 0; i < array.length; i++) {
			sum += array[i];
		}
		return sum / array.length;
	}
}