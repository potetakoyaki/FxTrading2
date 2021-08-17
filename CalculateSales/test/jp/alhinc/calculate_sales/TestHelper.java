package jp.alhinc.calculate_sales;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/**
 * JUitのヘルパークラス.
 */
public final class TestHelper {

	/**
	 * プライベートコンストラクタ.
	 */
	private TestHelper() {
	}

	/**
	 * privateなインスタンスメソッド向けの呼び出しヘルパーメソッド.
	 *
	 * <pre>
	 * {
	 * 	&#64;code
	 * 	String hoge = "abcd";
	 * 	assertThat(run(hoge, "substring", 1, 3), is("bc"));
	 * }
	 * </pre>
	 *
	 * @param obj
	 *            呼び出したいprivateなインスタンスメソッドを持つオブジェクト
	 * @param methodName
	 *            呼び出したいメソッド名
	 * @param args
	 *            呼び出したいメソッドの引数
	 * @return 実行結果
	 */
	public static Object run(Object obj, String methodName, Object... args) {
		try {
			Method method = getInvokeTarget(obj.getClass(), methodName, args);
			method.setAccessible(true);
			return method.invoke(obj, args);
		} catch (NoSuchMethodException | SecurityException | IllegalAccessException | IllegalArgumentException
				| InvocationTargetException e) {
			throw new RuntimeException(e);
		}
	}

	/**
	 * privateなクラスメソッド向けの呼び出しヘルパーメソッド.
	 *
	 * <pre>
	 * {@code
	 * assertThat(run(Long.class, "parseLong", "12345"), is(12345L));
	 * }
	 * </pre>
	 *
	 * @param klass
	 *            呼び出したいprivateなクラスメソッドを持つクラス
	 * @param methodName
	 *            呼び出したいメソッド名
	 * @param args
	 *            呼び出したいメソッドの引数
	 * @return 実行結果
	 */
	@SuppressWarnings("rawtypes")
	public static Object run(Class klass, String methodName, Object... args) {
		try {
			Method method = getInvokeTarget(klass, methodName, args);
			method.setAccessible(true);
			return method.invoke(null, args);
		} catch (NoSuchMethodException | SecurityException | IllegalAccessException | IllegalArgumentException
				| InvocationTargetException e) {
			throw new RuntimeException(e);
		}
	}

	/**
	 * 実行対象のメソッドを取得する
	 *
	 * @param klass
	 *            検索対象クラス
	 * @param methodName
	 *            実行対象メソッド名
	 * @param args
	 *            実引数（可変長）
	 * @return 実行対象メソッド
	 * @throws NoSuchMethodException
	 *             合致するメソッドが存在しない場合
	 */
	private static Method getInvokeTarget(Class<?> klass, String methodName, Object... args)
			throws NoSuchMethodException {
		Method[] methods = klass.getDeclaredMethods();
		for (Method method : methods) {
			Class<?>[] paramTypes = method.getParameterTypes();
			if (method.getName().equals(methodName) && matchesParamTypes(paramTypes, args)) {
				return method;
			}
		}
		throw new NoSuchMethodException();
	}

	/**
	 * 仮引数と実引数の型を比較する
	 *
	 * @param paramTypes
	 *            仮引数の型の配列
	 * @param args
	 *            実引数の配列
	 * @return 比較結果（T：すべて一致、F：一致しない）
	 */
	private static boolean matchesParamTypes(Class<?>[] paramTypes, Object[] args) {
		if (paramTypes.length != args.length) {
			return false;
		}
		for (int i = 0; i < paramTypes.length; i++) {
			if (args[i] != null && !convertPrimitiveClass(paramTypes[i]).isInstance(args[i])) {
				return false;
			}
		}
		return true;
	}

	/**
	 * プリミティブ型を参照型に変換する
	 *
	 * @param klass
	 *            対象クラス
	 * @return 変換後のクラス
	 */
	private static Class<?> convertPrimitiveClass(Class<?> klass) {
		switch (klass.getName()) {
		case "byte":
			return Byte.class;
		case "short":
			return Short.class;
		case "int":
			return Integer.class;
		case "boolean":
			return Boolean.class;
		case "float":
			return Float.class;
		case "double":
			return Double.class;
		case "char":
			return Character.class;
		default:
			return klass;
		}
	}
}
