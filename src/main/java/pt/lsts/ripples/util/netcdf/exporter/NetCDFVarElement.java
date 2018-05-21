/*
 * Copyright (c) 2018 Universidade do Porto - Faculdade de Engenharia
 * Laboratório de Sistemas e Tecnologia Subaquática (LSTS)
 * All rights reserved.
 * Rua Dr. Roberto Frias s/n, sala I203, 4200-465 Porto, Portugal
 *
 * Author: pdias
 * May 18, 2018
 */
package pt.lsts.ripples.util.netcdf.exporter;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import ucar.ma2.Array;
import ucar.ma2.ArrayBoolean;
import ucar.ma2.ArrayByte;
import ucar.ma2.ArrayChar;
import ucar.ma2.ArrayDouble;
import ucar.ma2.ArrayFloat;
import ucar.ma2.ArrayInt;
import ucar.ma2.ArrayLong;
import ucar.ma2.ArrayShort;
import ucar.ma2.ArrayString;
import ucar.ma2.DataType;
import ucar.ma2.Index;
import ucar.nc2.Attribute;
import ucar.nc2.Dimension;
import ucar.nc2.Group;
import ucar.nc2.NetcdfFileWriter;
import ucar.nc2.Variable;

/**
 * @author pdias
 *
 */
public class NetCDFVarElement {
    
    public enum ISO19115_1CodeSourceOfData {
        // ISO 19115-1 code to indicate the source of the data (image, thematicClassification, physicalMeasurement,
        // auxiliaryInformation, qualityInformation, referenceInformation, modelResult, or coordinate)
        image,
        thematicClassification,
        physicalMeasurement,
        auxiliaryInformation,
        qualityInformation,
        referenceInformation,
        modelResult,
        coordinate;
    }
    
    private String name;
    private String longName = null;
    private String standardName = null;
    private String units = null;
    private ISO19115_1CodeSourceOfData coverageContentType = null;
    
    private DataType dataType = null;
    private Group group = null;
    private List<Dimension> dimensions = null;

    private Map<String, String> additionalAttrib = new LinkedHashMap<>(); 
    
    private Variable var = null;
    private Array dataArray = null;
    
    public NetCDFVarElement(String name) {
        this.name = name;
    }
    
    /**
     * @return the name
     */
    public String getName() {
        return name;
    }
    
    /**
     * @param name the name to set
     * @return 
     */
    public NetCDFVarElement setName(String name) {
        this.name = name;
        return this;
    }
    
    /**
     * @return the longName
     */
    public String getLongName() {
        return longName;
    }
    
    /**
     * @param longName the longName to set
     * @return 
     */
    public NetCDFVarElement setLongName(String longName) {
        this.longName = longName;
        return this;
    }
    
    /**
     * @return the standardName
     */
    public String getStandardName() {
        return standardName;
    }
    
    /**
     * @param standardName the standardName to set
     * @return 
     */
    public NetCDFVarElement setStandardName(String standardName) {
        this.standardName = standardName;
        return this;
    }
    
    /**
     * @return the units
     */
    public String getUnits() {
        return units;
    }
    
    /**
     * @param units the units to set
     * @return 
     */
    public NetCDFVarElement setUnits(String units) {
        this.units = units;
        return this;
    }
    
    /**
     * @return the coverageContentType
     */
    public ISO19115_1CodeSourceOfData getCoverageContentType() {
        return coverageContentType;
    }
    
    /**
     * @param coverageContentType the coverageContentType to set
     * @return 
     */
    public NetCDFVarElement setCoverageContentType(ISO19115_1CodeSourceOfData coverageContentType) {
        this.coverageContentType = coverageContentType;
        return this;
    }
    
    public NetCDFVarElement setAtribute(String name, String val) {
        if (name != null && !name.isEmpty())
            additionalAttrib.put(name, val);
        return this;
    }

    public NetCDFVarElement removeAtribute(String name, String val) {
        if (name != null && !name.isEmpty())
            additionalAttrib.remove(name);
        return this;
    }

    /**
     * @return the dataType
     */
    public DataType getDataType() {
        return dataType;
    }
    
    /**
     * @param dataType the dataType to set
     * @return 
     */
    public NetCDFVarElement setDataType(DataType dataType) {
        this.dataType = dataType;
        return this;
    }

    /**
     * @return
     */
    public Array createDataArray() {
        if (dataArray != null)
            return dataArray;
        
        int[] dim = dimensions.stream().mapToInt(d -> d.getLength()).toArray();
        switch (dataType) {
            case BOOLEAN:
                dataArray = new ArrayBoolean(dim);
                break;
            case BYTE:
                dataArray = new ArrayByte(dim);
                break;
            case CHAR:
                dataArray = new ArrayChar(dim);
                break;
            case DOUBLE:
                dataArray = new ArrayDouble(dim);
                break;
            case FLOAT:
                dataArray = new ArrayFloat(dim);
                break;
            case INT:
                dataArray = new ArrayInt(dim);
                break;
            case LONG:
                dataArray = new ArrayLong(dim);
                break;
            case SHORT:
                dataArray = new ArrayShort(dim);
                break;
            case STRING:
                dataArray = new ArrayString(dim);
            case ENUM1:
            case ENUM2:
            case ENUM4:
            case OBJECT:
            case OPAQUE:
            case SEQUENCE:
            case STRUCTURE:
            default:
                dataArray = null;
                break;
        }
        return dataArray;
    }
    
    public boolean insertData(boolean value, int... index) {
        try {
            if (dataArray == null)
                createDataArray();
            Index idx = setindexAt(index);
            dataArray.setBoolean(idx, value);
            return true;
        }
        catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean insertData(byte value, int... index) {
        try {
            if (dataArray == null)
                createDataArray();
            Index idx = setindexAt(index);
            dataArray.setByte(idx, value);
            return true;
        }
        catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean insertData(char value, int... index) {
        try {
            if (dataArray == null)
                createDataArray();
            Index idx = setindexAt(index);
            dataArray.setChar(idx, value);
            return true;
        }
        catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean insertData(double value, int... index) {
        try {
            if (dataArray == null)
                createDataArray();
            Index idx = setindexAt(index);
            dataArray.setDouble(idx, value);
            return true;
        }
        catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean insertData(float value, int... index) {
        try {
            if (dataArray == null)
                createDataArray();
            Index idx = setindexAt(index);
            dataArray.setFloat(idx, value);
            return true;
        }
        catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean insertData(int value, int... index) {
        try {
            if (dataArray == null)
                createDataArray();
            Index idx = setindexAt(index);
            dataArray.setInt(idx, value);
            return true;
        }
        catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean insertData(long value, int... index) {
        try {
            if (dataArray == null)
                createDataArray();
            Index idx = setindexAt(index);
            dataArray.setLong(idx, value);
            return true;
        }
        catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean insertData(short value, int... index) {
        try {
            if (dataArray == null)
                createDataArray();
            Index idx = setindexAt(index);
            dataArray.setShort(idx, value);
            return true;
        }
        catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean insertData(String value, int... index) {
        try {
            if (dataArray == null)
                createDataArray();
            Index idx = setindexAt(index);
            ((ArrayString) dataArray).set(idx, value);
            return true;
        }
        catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    private Index setindexAt(int... index) {
        Index idx = dataArray.getIndex();
        idx.set(index);
        return idx;
    }
    
    /**
     * @return the group
     */
    public Group getGroup() {
        return group;
    }
    
    /**
     * @param group the group to set
     * @return 
     */
    public NetCDFVarElement setGroup(Group group) {
        this.group = group;
        return this;
    }
    
    /**
     * @return the dimensions
     */
    public List<Dimension> getDimensions() {
        return dimensions;
    }
    
    /**
     * @param dimensions the dimensions to set
     * @return 
     */
    public NetCDFVarElement setDimensions(List<Dimension> dimensions) {
        this.dimensions = dimensions;
        return this;
    }
    
    public boolean writeVariable(NetcdfFileWriter writer) {
        try {
            var = writer.addVariable(group, name, dataType, dimensions);
            if (longName != null)
                var.addAttribute(new Attribute("long_name", longName));
            if (standardName != null)
                var.addAttribute(new Attribute("standard_name", standardName));
            if (units != null)
                var.addAttribute(new Attribute("units", units));
            if (coverageContentType != null)
                var.addAttribute(new Attribute("coverage_content_type", coverageContentType.toString()));
            
            additionalAttrib.keySet().stream().forEach(name -> {
                String val = additionalAttrib.get(name);
                if (val == null)
                    return;
                var.addAttribute(new Attribute(name, val));
            });
            
            if (dimensions == null || dimensions.size() == 0) {
                // Create a scalar Variable named scalar of type double. Note that the empty ArrayList means that it is
                // a scalar, ie has no Dimensions.
                
            }
        }
        catch (Exception e) {
            e.printStackTrace();
            var = null;
            return false;
        }
        return true;
    }
    
    public boolean writeData(NetcdfFileWriter writer) {
        try {
            if (dimensions != null && dimensions.size() >= 0)
                writer.write(var, dataArray);
        }
        catch (Exception e) {
        	e.printStackTrace();
            return false;
        }
        return true;
    }
}
