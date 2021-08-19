package method_drill;

public class Question10 {
	
	public static void main(String[] args) {
		Point p = new Point(1.0, 2.0);
		System.out.println(getDistanceFromOrigin(p));
	}

    static double getDistanceFromOrigin(Point p) {
		double distance = Math.sqrt(p.x * p.x + p.y * p.y);
		return distance;
	}
}