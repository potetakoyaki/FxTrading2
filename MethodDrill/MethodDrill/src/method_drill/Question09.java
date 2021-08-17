package method_drill;

public class Question09 {
	
	public static void main(String[] args) {
		String[] array = {"野菜", "お肉", "麺"};
		System.out.println(getLongestString(array));
	}

	static String getLongestString(String[] array) {
		String strEat = null;
		int num = array[0].length();

		for(int i = 0; i < array.length; i++) {
			if(num <= array[i].length()) {
				num = array[i].length();
			 strEat = array[i];
			}
		}
		return strEat;
	}

}