package method_drill;

public class Question07 {
	
	public static void main(String[] args) {
		
		System.out.println(getMessage("佐藤",true));
		
	}
  
	static String  getMessage(String name, boolean isKid) {
		if (isKid == true) {
			return "こんにちは。" + name + "ちゃん。";
		}else {
			return "こんにちは。" + name + "さん。";
		}
		
	}
}